import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class GitflowModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "gitflow.module",
    owner: "packages/addons/gitflow/modules/gitflow",
    version: "1.0.0",
    dependencies: ["gitflow.provider"],
    contracts: ["gitflow.v1"],
    events: { published: ["gitflow.commit.created"], consumed: ["gitflow.pull_request.created"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
