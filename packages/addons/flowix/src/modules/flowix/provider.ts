import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class FlowixModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "flowix.module",
    owner: "packages/addons/flowix/modules/flowix",
    version: "1.0.0",
    dependencies: ["flowix.provider"],
    contracts: ["flowix.v1"],
    events: { published: ["flowix.workflow.started"], consumed: ["flowix.workflow.completed"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
