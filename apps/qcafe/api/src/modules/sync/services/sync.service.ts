import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type { AppendChange, RegisterDevice, ReportConflict, SyncScope } from "../contracts/sync.contract.js";
import { SyncRepository } from "../repository/sync.repository.js";

export class SyncConflictError extends Error {}

const FINANCIAL_ENTITY_TYPES = new Set([
  "bill",
  "payment",
  "refund",
  "voucher",
  "receipt",
  "settlement",
  "cash-movement",
  "day-close",
]);

export function isFinancialEntityType(entityType: string): boolean {
  return FINANCIAL_ENTITY_TYPES.has(entityType);
}

export class SyncService {
  constructor(
    private readonly repo: SyncRepository,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(scope: SyncScope) {
    return this.repo.workspace(scope);
  }

  async registerDevice(input: RegisterDevice, context: CommandContext) {
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new SyncConflictError("The sync outlet scope is invalid.");
    }
    const id = await this.repo.registerDevice(input, context.actorId, this.timestamp());
    await this.record(context, "device.registered", id, "device", { deviceCode: input.deviceCode });
    return { id };
  }

  async revokeDevice(deviceId: string, context: CommandContext) {
    const device = await this.repo.device(deviceId);
    if (!device) throw new SyncConflictError("The device is invalid.");
    if (device.status !== "active") throw new SyncConflictError("Only an active device can be revoked.");
    await this.repo.revokeDevice(deviceId, this.timestamp());
    await this.record(context, "device.revoked", deviceId, "device", {});
    return this.read({ businessId: device.business_id, locationId: device.location_id });
  }

  async appendChange(input: AppendChange, context: CommandContext) {
    const scope = { businessId: input.businessId, locationId: input.locationId };
    if (!(await this.repo.location(scope))) throw new SyncConflictError("The sync outlet scope is invalid.");
    if (input.deviceId) {
      const device = await this.repo.device(input.deviceId);
      if (!device || device.location_id !== input.locationId || device.status !== "active") {
        throw new SyncConflictError("The change device is invalid.");
      }
      await this.repo.touchDevice(input.deviceId, this.timestamp());
    }
    const id = await this.repo.appendChange(scope, input, this.timestamp());
    await this.record(context, "change.appended", id, "change", { entityType: input.entityType });
    return { id };
  }

  async pendingChanges(deviceId: string) {
    const device = await this.repo.device(deviceId);
    if (!device || device.status !== "active") throw new SyncConflictError("The device is invalid.");
    const cursor = await this.repo.cursorFor(deviceId);
    const changes = await this.repo.changesSince(
      { businessId: device.business_id, locationId: device.location_id },
      cursor?.last_seq ?? 0,
    );
    return { changes, lastSeq: changes.length ? changes[changes.length - 1]!.seq : (cursor?.last_seq ?? 0) };
  }

  async pushChanges(
    deviceId: string,
    changes: ReadonlyArray<{ actorRef: string; changeKind: string; entityId: string; entityType: string; id: string }>,
    context: CommandContext,
  ) {
    const device = await this.repo.device(deviceId);
    if (!device || device.status !== "active") throw new SyncConflictError("The device is invalid.");
    const scope = { businessId: device.business_id, locationId: device.location_id };
    const cursor = await this.repo.cursorFor(deviceId);
    const accepted: string[] = [];
    const duplicates: string[] = [];
    const conflicts: string[] = [];
    for (const change of changes) {
      if (await this.repo.findChange(change.id)) {
        duplicates.push(change.id);
        continue;
      }
      const remote = await this.repo.latestRemoteChange(
        scope,
        change.entityType,
        change.entityId,
        deviceId,
        cursor?.last_seq ?? 0,
      );
      if (remote) {
        const conflictId = await this.repo.reportConflict(
          scope,
          {
            businessId: scope.businessId,
            entityId: change.entityId,
            entityType: change.entityType,
            localChangeId: change.id,
            locationId: scope.locationId,
            reason: `Concurrent edit from ${device.device_code}: local change competes with change ${remote.id}.`,
            remoteChangeId: remote.id,
          },
          this.timestamp(),
        );
        await this.record(context, "conflict.reported", conflictId, "conflict", { entityType: change.entityType });
        conflicts.push(conflictId);
        continue;
      }
      await this.repo.appendChange(
        scope,
        { ...change, businessId: scope.businessId, deviceId, locationId: scope.locationId },
        this.timestamp(),
        change.id,
      );
      await this.record(context, "change.appended", change.id, "change", { entityType: change.entityType });
      accepted.push(change.id);
    }
    await this.repo.touchDevice(deviceId, this.timestamp());
    return { accepted, conflicts, duplicates };
  }

  async advanceCursor(deviceId: string, lastSeq: number, context: CommandContext) {
    const device = await this.repo.device(deviceId);
    if (!device || device.status !== "active") throw new SyncConflictError("The device is invalid.");
    const cursor = await this.repo.cursorFor(deviceId);
    if (lastSeq <= (cursor?.last_seq ?? 0)) {
      throw new SyncConflictError("The cursor must move forward.");
    }
    await this.repo.advanceCursor(deviceId, lastSeq, this.timestamp());
    await this.record(context, "cursor.advanced", deviceId, "device", { lastSeq });
    return this.read({ businessId: device.business_id, locationId: device.location_id });
  }

  async reportConflict(input: ReportConflict, context: CommandContext) {
    const scope = { businessId: input.businessId, locationId: input.locationId };
    if (!(await this.repo.location(scope))) throw new SyncConflictError("The sync outlet scope is invalid.");
    const id = await this.repo.reportConflict(scope, input, this.timestamp());
    await this.record(context, "conflict.reported", id, "conflict", { entityType: input.entityType });
    return { id };
  }

  async resolveConflict(
    conflictId: string,
    input: { decidedBy: string; reason: string; resolution: "keep-local" | "keep-remote" | "retry" | "escalated" },
    context: CommandContext,
  ) {
    const conflict = await this.repo.conflict(conflictId);
    if (!conflict) throw new SyncConflictError("The conflict is invalid.");
    if (conflict.status !== "pending") throw new SyncConflictError("Only a pending conflict can be resolved.");
    if (!input.decidedBy.trim() || !input.reason.trim()) {
      throw new SyncConflictError(
        "A conflict resolution requires a decider and a reason. Silent resolution is not permitted.",
      );
    }
    await this.repo.resolveConflict(conflictId, input.resolution, input.reason, input.decidedBy, this.timestamp());
    await this.record(context, "conflict.resolved", conflictId, "conflict", { resolution: input.resolution });
    return this.read({ businessId: conflict.business_id, locationId: conflict.location_id });
  }

  private timestamp() {
    return this.now().toISOString();
  }

  private record(
    context: CommandContext,
    event: string,
    subjectId: string,
    subjectType: string,
    payload?: Record<string, unknown>,
  ) {
    return this.activity.record(context, {
      eventType: `qcafe.sync.${event}`,
      payload,
      subjectId,
      subjectType,
    });
  }
}
