import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class NotifyzModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "notifyz.module",
    owner: "packages/addons/notifyz/modules/notifyz",
    version: "1.0.0",
    dependencies: ["notifyz.provider"],
    contracts: ["notifyz.v1"],
    events: { published: ["notifyz.notification.created"], consumed: ["notifyz.notification.sent"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
