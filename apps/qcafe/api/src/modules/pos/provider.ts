import type { ModuleProvider } from "@codexsun/framework";

export class QcafePosProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.pos",
    owner: "apps/qcafe/api/modules/pos",
    version: "2.0.0",
    dependencies: ["qcafe.foundation", "qcafe.menu"],
    contracts: ["qcafe.pos.orders.v1", "qcafe.pos.fulfillment.v1"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
