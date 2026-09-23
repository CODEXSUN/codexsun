import { createLifecycleChecksum } from "@codexsun/platform-core";
import { sql, type Kysely } from "kysely";
import type { SettingsDatabase } from "../settings.database.js";

export const settingsMigration = {
  checksum: createLifecycleChecksum(
    "settings.001|platform_settings:key text primary key,value text not null,visibility text default operator|visibility index",
  ),
  description: "Create platform settings records and the visibility index.",
  id: "settings.001",
  owner: "core/platforms/api/modules/settings",
  async apply(database: Kysely<SettingsDatabase>): Promise<void> {
    await database.schema
      .createTable("platform_settings")
      .ifNotExists()
      .addColumn("key", "text", (column) => column.primaryKey())
      .addColumn("value", "text", (column) => column.notNull())
      .addColumn("visibility", "text", (column) => column.notNull().defaultTo("operator"))
      .execute();
    await sql`create index if not exists platform_settings_visibility_index on platform_settings (visibility)`.execute(
      database,
    );
  },
};
