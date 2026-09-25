import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type {
  BackupScope,
  CreateBackupSchedule,
  RecordBackup,
  SelectDataFolder,
} from "../contracts/backup.contract.js";
import type { QcafeBackupDatabase } from "../persistence/backup.database.js";

export class BackupRepository {
  constructor(private readonly db: Kysely<QcafeFoundationDatabase>) {}

  private tables() {
    return this.db as unknown as Kysely<QcafeBackupDatabase>;
  }

  location(scope: BackupScope) {
    return this.db
      .selectFrom("qcafe_locations")
      .select("id")
      .where("id", "=", scope.locationId)
      .where("business_id", "=", scope.businessId)
      .executeTakeFirst();
  }

  schedule(id: string) {
    return this.tables().selectFrom("qcafe_backup_schedules").selectAll().where("id", "=", id).executeTakeFirst();
  }

  async setScheduleActive(id: string, active: boolean, now: string) {
    await this.tables()
      .updateTable("qcafe_backup_schedules")
      .set({ active: active ? 1 : 0, updated_at: now })
      .where("id", "=", id)
      .execute();
  }

  backup(id: string) {
    return this.tables().selectFrom("qcafe_backups").selectAll().where("id", "=", id).executeTakeFirst();
  }

  async workspace(scope: BackupScope) {
    const db = this.tables();
    const dataFolders = await db
      .selectFrom("qcafe_data_folders")
      .selectAll()
      .where("location_id", "=", scope.locationId)
      .execute();
    const backupSchedules = await db
      .selectFrom("qcafe_backup_schedules")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("name")
      .execute();
    const backups = await db
      .selectFrom("qcafe_backups")
      .selectAll()
      .where("business_id", "=", scope.businessId)
      .where("location_id", "=", scope.locationId)
      .orderBy("created_at", "desc")
      .execute();
    const backupIds = backups.map((backup) => backup.id);
    return {
      backupSchedules,
      backups,
      dataFolders,
      restoreChecks: backupIds.length
        ? await db.selectFrom("qcafe_restore_checks").selectAll().where("backup_id", "in", backupIds).execute()
        : [],
    };
  }

  async selectDataFolder(input: SelectDataFolder, actor: string, now: string) {
    const existing = await this.tables()
      .selectFrom("qcafe_data_folders")
      .select("location_id")
      .where("location_id", "=", input.locationId)
      .executeTakeFirst();
    if (existing) {
      await this.tables()
        .updateTable("qcafe_data_folders")
        .set({ folder_path: input.folderPath, selected_at: now, selected_by: actor, updated_at: now })
        .where("location_id", "=", input.locationId)
        .execute();
      return input.locationId;
    }
    await this.tables()
      .insertInto("qcafe_data_folders")
      .values({
        folder_path: input.folderPath,
        location_id: input.locationId,
        selected_at: now,
        selected_by: actor,
        updated_at: now,
      })
      .execute();
    return input.locationId;
  }

  async createSchedule(input: CreateBackupSchedule, actor: string, now: string) {
    const existing = await this.tables()
      .selectFrom("qcafe_backup_schedules")
      .select("id")
      .where("location_id", "=", input.locationId)
      .where("name", "=", input.name)
      .executeTakeFirst();
    if (existing) return existing.id;
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_backup_schedules")
      .values({
        active: 1,
        business_id: input.businessId,
        created_at: now,
        created_by: actor,
        frequency: input.frequency,
        id,
        location_id: input.locationId,
        name: input.name,
        retain_count: input.retainCount,
        updated_at: now,
      })
      .execute();
    return id;
  }

  async recordBackup(scope: BackupScope, input: RecordBackup, actor: string, now: string) {
    const id = randomUUID();
    await this.tables()
      .insertInto("qcafe_backups")
      .values({
        business_id: scope.businessId,
        checksum: input.checksum,
        created_at: now,
        created_by: actor,
        file_ref: input.fileRef,
        id,
        location_id: scope.locationId,
        schedule_id: input.scheduleId ?? null,
        size_bytes: input.sizeBytes,
        status: input.status,
      })
      .execute();
    return id;
  }

  async submitRestoreCheck(
    backupId: string,
    status: "passed" | "failed",
    detail: string | undefined,
    actor: string,
    now: string,
  ) {
    return this.db.transaction().execute(async (tx) => {
      const db = tx as unknown as Kysely<QcafeBackupDatabase>;
      const id = randomUUID();
      await db
        .insertInto("qcafe_restore_checks")
        .values({ backup_id: backupId, checked_at: now, checked_by: actor, detail: detail ?? null, id, status })
        .execute();
      if (status === "passed") {
        await db.updateTable("qcafe_backups").set({ status: "verified" }).where("id", "=", backupId).execute();
      }
      return id;
    });
  }
}
