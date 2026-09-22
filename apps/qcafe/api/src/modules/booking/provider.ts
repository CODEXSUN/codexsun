import type { ModuleProvider } from "@codexsun/framework";

export class QcafeBookingProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.booking",
    owner: "apps/qcafe/api/modules/booking",
    version: "1.2.0",
    dependencies: ["qcafe.foundation", "qcafe.pos", "qcafe.billing"],
    contracts: [
      "qcafe.booking.table-service.v1",
      "qcafe.booking.guest-reservations.v1",
      "qcafe.booking.event-sales.v1",
    ],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
