import type { ModuleProvider } from "@codexsun/framework";

export class QcafeDocumentsProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.documents",
    owner: "apps/qcafe/api/modules/documents",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: ["GET /api/v1/qcafe/documents"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
