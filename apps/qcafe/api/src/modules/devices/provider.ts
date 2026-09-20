import type { ModuleProvider } from "@codexsun/framework";

export class QcafeDevicesProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.devices",
    owner: "apps/qcafe/api/modules/devices",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: [],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
