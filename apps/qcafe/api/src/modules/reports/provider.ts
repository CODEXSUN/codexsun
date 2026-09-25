import type { ModuleProvider } from "@codexsun/framework";

export class QcafeReportsProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.reports",
    owner: "apps/qcafe/api/modules/reports",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: ["GET /api/v1/qcafe/reports/sales"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
