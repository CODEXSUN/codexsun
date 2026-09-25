import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";
import type { QcafeBackupDatabase } from "./backup.database.js";

const migration = {
  checksum: createLifecycleChecksum(
    "qcafe.backup.001|data-folders,backup-schedules,backups,restore-checks|business,location,schedule,backup foreign keys|verified only after passing restore check",
  ),
  description: "Create Q Cafe data folders, backup schedules, backups, and restore checks.",
  id: "qcafe.backup.001",
  owner: "qcafe.backup",
  async apply(database: Kysely<QcafeFoundationDatabase>) {
    const db = database as unknown as Kysely<QcafeBackupDatabase>;
    await db.schema
      .createTable("qcafe_data_folders")
      .ifNotExists()
      .addColumn("location_id", "varchar(36)", (c) => c.primaryKey().references("qcafe_locations.id"))
      .addColumn("folder_path", "varchar(320)", (c) => c.notNull())
      .addColumn("selected_by", "varchar(120)", (c) => c.notNull())
      .addColumn("selected_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_backup_schedules")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("name", "varchar(120)", (c) => c.notNull())
      .addColumn("frequency", "varchar(16)", (c) => c.notNull())
      .addColumn("retain_count", "integer", (c) => c.notNull())
      .addColumn("active", "integer", (c) => c.notNull().defaultTo(1))
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .addColumn("updated_at", "varchar(40)", (c) => c.notNull())
      .addUniqueConstraint("qcafe_backup_schedules_location_name_key", ["location_id", "name"])
      .execute();
    await db.schema
      .createTable("qcafe_backups")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("business_id", "varchar(36)", (c) => c.notNull().references("qcafe_businesses.id"))
      .addColumn("location_id", "varchar(36)", (c) => c.notNull().references("qcafe_locations.id"))
      .addColumn("schedule_id", "varchar(36)", (c) => c.references("qcafe_backup_schedules.id"))
      .addColumn("file_ref", "varchar(320)", (c) => c.notNull())
      .addColumn("checksum", "varchar(128)", (c) => c.notNull())
      .addColumn("size_bytes", "integer", (c) => c.notNull())
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("created_by", "varchar(120)", (c) => c.notNull())
      .addColumn("created_at", "varchar(40)", (c) => c.notNull())
      .execute();
    await db.schema
      .createTable("qcafe_restore_checks")
      .ifNotExists()
      .addColumn("id", "varchar(36)", (c) => c.primaryKey())
      .addColumn("backup_id", "varchar(36)", (c) => c.notNull().references("qcafe_backups.id"))
      .addColumn("status", "varchar(16)", (c) => c.notNull())
      .addColumn("detail", "varchar(500)")
      .addColumn("checked_by", "varchar(120)", (c) => c.notNull())
      .addColumn("checked_at", "varchar(40)", (c) => c.notNull())
      .execute();
  },
};

export const qcafeBackupLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [migration],
  moduleId: "qcafe.backup",
  seeders: [],
};
