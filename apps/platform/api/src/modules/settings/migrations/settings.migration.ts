import { sql, type Kysely } from "kysely";
import type { SettingsDatabase } from "../settings.database.js";

export const settingsMigration = {
  id: "settings.001",
  owner: "apps/platform/api/modules/settings",
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
