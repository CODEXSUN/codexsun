import type { ModuleProvider } from "@codexsun/framework";

export class QcafeBookingProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.booking",
    owner: "apps/qcafe/api/modules/booking",
    version: "1.0.0",
    dependencies: ["qcafe.foundation"],
    contracts: [],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
