import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { AppendChange, RegisterDevice, ReportConflict, SyncScope } from "../contracts/sync.contract.js";
import type { QcafeSyncDatabase } from "../persistence/sync.database.js";

export class SyncRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  private tables() {
    return this.db as unknown as Kysely<QcafeSyncDatabase>;
  }

  location(scope: SyncScope) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", scope.locationId)
      .where("business_id", "=", scope.businessId)
      .executeTakeFirst();
  }

  device(id: string) {
    return this.tables().selectFrom("qcafe_device_profiles").selectAll().where("id", "=", id).executeTakeFirst();
  }

  conflict(id: string) {
    return this.tables().selectFrom("qcafe_sync_conflicts").selectAll().where("id", "=", id).executeTakeFirst();
  }

  async workspace(scope: SyncScope, limit = 200) {
    const db = this.tables();
    const devices = await db
      .selectFrom("qcafe_device_profiles")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("device_code")
      .execute();
    const deviceIds = devices.map((device) => device.id);
    const changes = await db
      .selectFrom("qcafe_change_log")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("seq", "desc")
      .limit(limit)
      .execute();
    const conflicts = await db
      .selectFrom("qcafe_sync_conflicts")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("created_at", "desc")
      .execute();
    return {
      changes,
      conflicts,
      cursors: deviceIds.length
        ? await db.selectFrom("qcafe_sync_cursors").selectAll().where("device_id", "in", deviceIds).execute()
        : [],
      devices,
    };
  }

  async registerDevice(input: RegisterDevice, actor: string, now: string) {
    const db = this.tables();
    const existing = await db
      .selectFrom("qcafe_device_profiles")
      .select("id")
      .where("business_id", "=", input.businessId)
      .where("device_code", "=", input.deviceCode)
      .executeTakeFirst();
    if (existing) return existing.id;
    const id = randomUUID();
    await db.transaction().execute(async (tx) => {
      await tx
        .insertInto("qcafe_device_profiles")
        .values({
          business_id: input.businessId,
          created_at: now,
          created_by: actor,
          device_code: input.deviceCode,
          id,
          last_seen_at: null,
          location_id: input.locationId,
          name: input.name,
          platform: input.platform,
          status: "active",
          updated_at: now,
        })
        .execute();
      await tx.insertInto("qcafe_sync_cursors").values({ device_id: id, last_seq: 0, updated_at: now }).execute();
    });
    return id;
  }

  async revokeDevice(id: string, now: string) {
    await this.tables()
      .updateTable("qcafe_device_profiles")
      .set({ status: "revoked", updated_at: now })
      .where("id", "=", id)
      .where("status", "=", "active")
      .execute();
  }

  async touchDevice(id: string, now: string) {
    await this.tables()
      .updateTable("qcafe_device_profiles")
      .set({ last_seen_at: now, updated_at: now })
      .where("id", "=", id)
      .execute();
  }

  async appendChange(scope: SyncScope, input: AppendChange, now: string, changeId?: string) {
    const id = changeId ?? randomUUID();
    await this.tables()
      .insertInto("qcafe_change_log")
      .values({
        actor_ref: input.actorRef,
        business_id: scope.businessId,
        change_kind: input.changeKind,
        created_at: now,
        device_id: input.deviceId ?? null,
        entity_id: input.entityId,
        entity_type: input.entityType,
        id,
        location_id: scope.locationId,
        occurred_at: now,
      })
      .execute();
    return id;
  }

  findChange(id: string) {
    return this.tables().selectFrom("qcafe_change_log").selectAll().where("id", "=", id).executeTakeFirst();
  }

  async latestRemoteChange(
    scope: SyncScope,
    entityType: string,
    entityId: string,
    excludeDeviceId: string,
    sinceSeq: number,
  ) {
    return this.tables()
      .selectFrom("qcafe_change_log")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .where("entity_type", "=", entityType)
      .where("entity_id", "=", entityId)
      .where("seq", ">", sinceSeq)
      .where((eb) => eb.or([eb("device_id", "!=", excludeDeviceId), eb("device_id", "is", null)]))
      .orderBy("seq", "desc")
      .executeTakeFirst();
  }

  async cursorFor(deviceId: string) {
    return this.tables()
      .selectFrom("qcafe_sync_cursors")
      .selectAll()
      .where("device_id", "=", deviceId)
      .executeTakeFirst();
  }

  async advanceCursor(deviceId: string, lastSeq: number, now: string) {
    await this.tables()
      .updateTable("qcafe_sync_cursors")
      .set({ last_seq: lastSeq, updated_at: now })
      .where("device_id", "=", deviceId)
      .execute();
  }

  async changesSince(scope: SyncScope, sinceSeq: number, limit = 200) {
    return this.tables()
      .selectFrom("qcafe_change_log")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .where("seq", ">", sinceSeq)
      .orderBy("seq")
      .limit(limit)
      .execute();
  }

  async reportConflict(scope: SyncScope, input: ReportConflict, now: string) {
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_sync_conflicts")
      .values({
        business_id: scope.businessId,
        created_at: now,
        decided_at: null,
        decided_by: null,
        entity_id: input.entityId,
        entity_type: input.entityType,
        id,
        local_change_id: input.localChangeId ?? null,
        location_id: scope.locationId,
        reason: input.reason,
        remote_change_id: input.remoteChangeId ?? null,
        resolution: null,
        status: "pending",
      })
      .execute();
    return id;
  }

  async resolveConflict(id: string, resolution: string, reason: string, decidedBy: string, now: string) {
    await this.tables()
      .updateTable("qcafe_sync_conflicts")
      .set({
        decided_at: now,
        decided_by: decidedBy,
        reason,
        resolution,
        status: resolution === "escalated" ? "escalated" : "resolved",
      })
      .where("id", "=", id)
      .where("status", "=", "pending")
      .execute();
  }
}
