import type { ModuleProvider } from "@codexsun/framework";

export class QcafeAccountingProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.accounting",
    owner: "apps/qcafe/api/modules/accounting",
    version: "1.0.0",
    dependencies: ["qcafe.foundation", "qcafe.billing"],
    contracts: ["GET /api/v1/qcafe/accounting"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
