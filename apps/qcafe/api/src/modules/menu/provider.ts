import type { ModuleProvider } from "@codexsun/framework";

export class QcafeMenuProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.menu",
    owner: "apps/qcafe/api/modules/menu",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: [],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
