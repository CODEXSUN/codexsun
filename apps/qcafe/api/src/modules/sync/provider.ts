import type { ModuleProvider } from "@codexsun/framework";

export class QcafeSyncProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.sync",
    owner: "apps/qcafe/api/modules/sync",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: ["GET /api/v1/qcafe/sync"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
