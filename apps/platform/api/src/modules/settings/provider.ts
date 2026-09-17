import { type ModuleProvider, type ProviderRegistrationContext } from "@codexsun/framework";
import { SettingsController } from "./controller/settings.controller.js";
import { InMemorySettingsRepository } from "./repository/settings.repository.js";
import { SettingsService } from "./service/settings.service.js";

export interface SettingsModuleConfiguration {
  readonly deploymentName: string;
}

export class SettingsModuleProvider implements ModuleProvider {
  constructor(private readonly configuration: SettingsModuleConfiguration) {}

  readonly manifest = {
    id: "platform.settings",
    owner: "apps/platform/api/modules/settings",
    version: "1.0.7",
    dependencies: ["platform.core"],
    contracts: ["platform.settings.read", "GET /api/v1/platform/settings"],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    const repository = new InMemorySettingsRepository([
      { key: "platform.name", value: this.configuration.deploymentName },
    ]);
    const service = new SettingsService(repository);
    context.provide("settings.service", service);
    context.provide("settings.controller", new SettingsController(service));
  }
}
