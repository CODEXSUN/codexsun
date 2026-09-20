import { createLifecycleChecksum, type DatabaseLifecyclePlan } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

const settingsMigration = {
  checksum: createLifecycleChecksum(
    "qcafe.settings.001|qcafe_runtime_settings,qcafe_connectors|safe connector metadata and secret references only",
  ),
  description: "Create Q Cafe runtime policy and connector registry tables.",
  id: "qcafe.settings.001",
  owner: "qcafe.settings",
  async apply(database: Kysely<QcafeFoundationDatabase>): Promise<void> {
    await database.schema.createTable("qcafe_runtime_settings").ifNotExists()
      .addColumn("key", "varchar(120)", (column) => column.primaryKey())
      .addColumn("value_json", "text", (column) => column.notNull())
      .addColumn("updated_by", "varchar(120)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
    await database.schema.createTable("qcafe_connectors").ifNotExists()
      .addColumn("id", "varchar(36)", (column) => column.primaryKey())
      .addColumn("kind", "varchar(24)", (column) => column.notNull())
      .addColumn("code", "varchar(40)", (column) => column.notNull().unique())
      .addColumn("name", "varchar(120)", (column) => column.notNull())
      .addColumn("endpoint_label", "varchar(160)")
      .addColumn("secret_reference", "varchar(160)")
      .addColumn("enabled", "integer", (column) => column.notNull().defaultTo(0))
      .addColumn("status", "varchar(24)", (column) => column.notNull())
      .addColumn("created_at", "varchar(40)", (column) => column.notNull())
      .addColumn("updated_at", "varchar(40)", (column) => column.notNull()).execute();
  },
};

export const qcafeSettingsLifecyclePlan: DatabaseLifecyclePlan<QcafeFoundationDatabase> = {
  migrations: [settingsMigration], moduleId: "qcafe.settings", seeders: [],
};
