import type { Actor } from "@codexsun/platform-core";
import type { SettingsReadResult, SettingsService } from "../service/settings.service.js";

export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  getSettings(actor: Actor): Promise<SettingsReadResult> {
    return this.service.readSettings(actor);
  }
}
