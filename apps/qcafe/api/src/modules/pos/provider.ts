import type { ModuleProvider } from "@codexsun/framework";

export class QcafePosProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.pos",
    owner: "apps/qcafe/api/modules/pos",
    version: "1.0.0",
    dependencies: ["qcafe.foundation", "qcafe.menu"],
    contracts: [],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
