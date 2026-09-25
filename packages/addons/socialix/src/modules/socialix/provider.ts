import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class SocialixModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "socialix.module",
    owner: "packages/addons/socialix/modules/socialix",
    version: "1.0.0",
    dependencies: ["socialix.provider"],
    contracts: ["socialix.v1"],
    events: { published: ["socialix.post.created"], consumed: ["socialix.post.published"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
