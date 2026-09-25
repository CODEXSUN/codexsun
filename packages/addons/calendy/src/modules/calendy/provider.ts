import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class CalendyModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "calendy.module",
    owner: "packages/addons/calendy/modules/calendy",
    version: "1.0.0",
    dependencies: ["calendy.provider"],
    contracts: ["calendy.v1"],
    events: { published: ["calendy.event.created"], consumed: ["calendy.event.updated"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
