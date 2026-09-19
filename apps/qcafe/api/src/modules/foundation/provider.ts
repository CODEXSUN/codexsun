import type { ModuleProvider } from "@codexsun/framework";

export class QcafeFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "qcafe.foundation", owner: "apps/qcafe/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["qcafe.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
