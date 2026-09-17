import type { Kysely } from "kysely";
import type { SettingsDatabase } from "../settings.database.js";

export const settingsSeeder = {
  id: "settings.seed.001",
  owner: "apps/platform/api/modules/settings",
  async seed(database: Kysely<SettingsDatabase>): Promise<void> {
    await database
      .insertInto("platform_settings")
      .values({ key: "platform.name", value: "CODEXSUN", visibility: "operator" })
      .onConflict((conflict) => conflict.column("key").doNothing())
      .execute();
  },
};
