import type { ModuleProvider } from "@codexsun/framework";

export class QcafeInventoryProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.inventory",
    owner: "apps/qcafe/api/modules/inventory",
    version: "1.0.0",
    dependencies: ["qcafe.foundation", "qcafe.menu"],
    contracts: ["GET /api/v1/qcafe/inventory"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
