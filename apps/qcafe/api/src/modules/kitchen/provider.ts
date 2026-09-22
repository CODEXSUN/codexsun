import type { ModuleProvider } from "@codexsun/framework";

export class QcafeKitchenProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.kitchen",
    owner: "apps/qcafe/api/modules/kitchen",
    version: "2.0.0",
    dependencies: ["qcafe.foundation", "qcafe.menu", "qcafe.pos"],
    contracts: ["qcafe.kitchen.tickets.v1", "qcafe.kitchen.print-attempts.v1"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
