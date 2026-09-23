import assert from "node:assert/strict";
import test from "node:test";
import { createSqliteDataProvider } from "@codexsun/platform-core";
import type { SettingsDatabase } from "../settings.database.js";
import { settingsMigration } from "../migrations/settings.migration.js";
import { KyselySettingsRepository } from "../repository/settings.repository.js";
import { settingsSeeder } from "../seeders/settings.seeder.js";

test("migrates, seeds, and reads module-owned settings", async () => {
  const provider = createSqliteDataProvider<SettingsDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await settingsMigration.apply(database);
  await settingsSeeder.seed(database);
  await settingsSeeder.seed(database);

  const settings = await new KyselySettingsRepository(database).list();

  assert.deepEqual(
    settings.map((setting) => ({ ...setting })),
    [{ key: "platform.name", value: "CODEXSUN" }],
  );
  await provider.destroy();
});
