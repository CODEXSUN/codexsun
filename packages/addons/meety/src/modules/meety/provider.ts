import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class MeetyModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "meety.module",
    owner: "packages/addons/meety/modules/meety",
    version: "1.0.0",
    dependencies: ["meety.provider"],
    contracts: ["meety.v1"],
    events: { published: ["meety.meeting.created"], consumed: ["meety.meeting.completed"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
