import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type {
  BackupScope,
  CreateBackupSchedule,
  RecordBackup,
  SelectDataFolder,
} from "../contracts/backup.contract.js";
import { BackupRepository } from "../repository/backup.repository.js";

export class BackupConflictError extends Error {}

export class BackupService {
  constructor(
    private readonly repo: BackupRepository,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  read(scope: BackupScope) {
    return this.repo.workspace(scope);
  }

  async selectDataFolder(input: SelectDataFolder, context: CommandContext) {
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new BackupConflictError("The backup outlet scope is invalid.");
    }
    if (
      !/^[A-Za-z]:[\\/]/.test(input.folderPath) &&
      !input.folderPath.startsWith("\\\\") &&
      !input.folderPath.startsWith("/")
    ) {
      throw new BackupConflictError("Use an absolute data-folder path, for example C:\\ProgramData\\Codexsun\\Qcafe.");
    }
    await this.repo.selectDataFolder(input, context.actorId, this.timestamp());
    await this.record(context, "data-folder.selected", input.locationId, "data-folder", {
      folderPath: input.folderPath,
    });
    return this.read({ businessId: input.businessId, locationId: input.locationId });
  }

  async createSchedule(input: CreateBackupSchedule, context: CommandContext) {
    if (!(await this.repo.location({ businessId: input.businessId, locationId: input.locationId }))) {
      throw new BackupConflictError("The backup outlet scope is invalid.");
    }
    const id = await this.repo.createSchedule(input, context.actorId, this.timestamp());
    await this.record(context, "backup-schedule.created", id, "backup-schedule", { frequency: input.frequency });
    return { id };
  }

  async setScheduleActive(scheduleId: string, active: boolean, context: CommandContext) {
    const schedule = await this.repo.schedule(scheduleId);
    if (!schedule) throw new BackupConflictError("The backup schedule is invalid.");
    if (!active) {
      const state = await this.repo.workspace({ businessId: schedule.business_id, locationId: schedule.location_id });
      const verified = state.backups.some((backup) => backup.status === "verified");
      if (!verified) throw new BackupConflictError("Keep at least one verified backup before disabling the schedule.");
    }
    await this.repo.setScheduleActive(scheduleId, active, this.timestamp());
    await this.record(
      context,
      active ? "backup-schedule.activated" : "backup-schedule.deactivated",
      scheduleId,
      "backup-schedule",
      {},
    );
    return { id: scheduleId };
  }

  async recordBackup(input: RecordBackup, context: CommandContext) {
    const scope = { businessId: input.businessId, locationId: input.locationId };
    if (!(await this.repo.location(scope))) throw new BackupConflictError("The backup outlet scope is invalid.");
    if (input.scheduleId) {
      const schedule = await this.repo.schedule(input.scheduleId);
      if (!schedule || schedule.business_id !== input.businessId || schedule.location_id !== input.locationId) {
        throw new BackupConflictError("The backup schedule is invalid.");
      }
    }
    const id = await this.repo.recordBackup(scope, input, context.actorId, this.timestamp());
    await this.record(context, "backup.recorded", id, "backup", { status: input.status });
    return this.read(scope);
  }

  async submitRestoreCheck(
    backupId: string,
    status: "passed" | "failed",
    detail: string | undefined,
    context: CommandContext,
  ) {
    const backup = await this.repo.backup(backupId);
    if (!backup) throw new BackupConflictError("The backup is invalid.");
    if (backup.status === "failed")
      throw new BackupConflictError("A failed backup cannot be restore-checked. Record a new backup.");
    if (status === "failed" && !detail) throw new BackupConflictError("A failed restore check requires a detail note.");
    const id = await this.repo.submitRestoreCheck(backupId, status, detail, context.actorId, this.timestamp());
    await this.record(
      context,
      status === "passed" ? "restore-check.passed" : "restore-check.failed",
      id,
      "restore-check",
      { backupId },
    );
    return this.read({ businessId: backup.business_id, locationId: backup.location_id });
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
      eventType: `qcafe.backup.${event}`,
      payload,
      subjectId,
      subjectType,
    });
  }
}
