import type { ModuleProvider } from "@codexsun/framework";

export class QcafeKitchenProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.kitchen",
    owner: "apps/qcafe/api/modules/kitchen",
    version: "1.0.0",
    dependencies: ["qcafe.foundation", "qcafe.menu", "qcafe.pos"],
    contracts: [],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
