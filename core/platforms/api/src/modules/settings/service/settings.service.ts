import { authorize, type Actor } from "@codexsun/platform-core";
import type { PlatformSetting } from "../contracts/platform-setting.contract.js";
import type { SettingsRepository } from "../repository/settings.repository.js";

export type SettingsReadResult =
  { readonly state: "found"; readonly settings: readonly PlatformSetting[] } | { readonly state: "forbidden" };

export class SettingsService {
  constructor(private readonly repository: SettingsRepository) {}

  async readSettings(actor: Actor): Promise<SettingsReadResult> {
    if (!authorize(actor, { permissions: ["platform.settings.read"] }).allowed) return { state: "forbidden" };
    return { state: "found", settings: await this.repository.list() };
  }
}
