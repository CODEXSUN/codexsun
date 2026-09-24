import type { ModuleProvider } from "@codexsun/framework";

export class OrshipDeploymentsProvider implements ModuleProvider {
  readonly manifest = {
    id: "orship.deployments",
    owner: "devkits/orship/api/modules/deployments",
    version: "1.0.0",
    dependencies: ["platform.core"],
    contracts: ["orship.deployments", "orship.deployment-provider"],
    events: { published: ["deployment.requested", "deployment.completed", "deployment.failed"], consumed: [] },
  };

  register(): void {}
}
