import type { ModuleProvider } from "@codexsun/framework";

export class QcafeMarketplaceProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.marketplace",
    owner: "apps/qcafe/api/modules/marketplace",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: ["GET /api/v1/qcafe/marketplace"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
