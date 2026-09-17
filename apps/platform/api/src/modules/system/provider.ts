import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class SystemModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "platform.system",
    owner: "apps/platform/api/modules/system",
    version: "1.0.2",
    dependencies: ["platform.core"],
    contracts: ["platform.system"],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    context.provide("platform.system", { name: "Platform System" });
  }
}
