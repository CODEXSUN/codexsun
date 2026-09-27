import type { ModuleProvider } from "@codexsun/framework";

export class BillingWorkspaceProvider implements ModuleProvider {
  readonly manifest = {
    id: "billing.workspace",
    owner: "apps/billing/api/modules/workspace",
    version: "1.0.0",
    dependencies: ["platform.core", "billing.foundation"],
    contracts: ["billing.workspace"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
