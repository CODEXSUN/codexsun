import type { ModuleProvider } from "@codexsun/framework";

export class QcafeBackupProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.backup",
    owner: "apps/qcafe/api/modules/backup",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: ["GET /api/v1/qcafe/backup"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
