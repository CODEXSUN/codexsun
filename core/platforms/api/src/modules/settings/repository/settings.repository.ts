import type { Kysely } from "kysely";
import type { PlatformSetting } from "../contracts/platform-setting.contract.js";
import type { SettingsDatabase } from "../settings.database.js";

export interface SettingsRepository {
  list(): Promise<readonly PlatformSetting[]>;
}

export class InMemorySettingsRepository implements SettingsRepository {
  constructor(private readonly settings: readonly PlatformSetting[]) {}

  async list(): Promise<readonly PlatformSetting[]> {
    return this.settings;
  }
}

export class KyselySettingsRepository implements SettingsRepository {
  constructor(private readonly database: Kysely<SettingsDatabase>) {}

  async list(): Promise<readonly PlatformSetting[]> {
    return this.database
      .selectFrom("platform_settings")
      .select(["key", "value"])
      .where("visibility", "=", "operator")
      .orderBy("key")
      .execute();
  }
}
