import type { ModuleProvider } from "@codexsun/framework";

export class QcafeFoundationProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.foundation",
    owner: "apps/qcafe/api/modules/foundation",
    version: "1.1.0",
    dependencies: ["platform.core"],
    contracts: ["qcafe.health", "qcafe.foundation.setup.v1", "qcafe.foundation.activity.v1"],
    events: { published: [], consumed: [] },
  };
  register(): void {}
}
