import type { ModuleProvider } from "@codexsun/framework";

export class QcafeBillingProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.billing",
    owner: "apps/qcafe/api/modules/billing",
    version: "1.0.0",
    dependencies: ["qcafe.foundation", "qcafe.pos"],
    contracts: [],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
