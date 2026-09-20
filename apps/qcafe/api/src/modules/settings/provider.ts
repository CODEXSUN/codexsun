import type { ModuleProvider } from "@codexsun/framework";

export class QcafeSettingsProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.settings",
    owner: "apps/qcafe/api/modules/settings",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: ["qcafe.settings.database.v1", "qcafe.settings.cloud-sync.v1", "qcafe.settings.connectors.v1"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
