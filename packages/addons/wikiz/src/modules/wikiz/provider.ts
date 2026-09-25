import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class WikizModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "wikiz.module",
    owner: "packages/addons/wikiz/modules/wikiz",
    version: "1.0.0",
    dependencies: ["wikiz.provider"],
    contracts: ["wikiz.v1"],
    events: { published: ["wikiz.page.created"], consumed: ["wikiz.page.updated"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
