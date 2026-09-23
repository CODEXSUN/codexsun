import { createLifecycleChecksum } from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import type { SettingsDatabase } from "../settings.database.js";

export const settingsSeeder = {
  checksum: createLifecycleChecksum("settings.seed.001|platform.name=CODEXSUN|visibility=operator|insert when missing"),
  description: "Seed the default platform name setting.",
  id: "settings.seed.001",
  owner: "core/platforms/api/modules/settings",
  async seed(database: Kysely<SettingsDatabase>): Promise<void> {
    await database
      .insertInto("platform_settings")
      .values({ key: "platform.name", value: "CODEXSUN", visibility: "operator" })
      .onConflict((conflict) => conflict.column("key").doNothing())
      .execute();
  },
};
