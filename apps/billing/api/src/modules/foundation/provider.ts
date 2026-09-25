import type { ModuleProvider } from "@codexsun/framework";

export class BillingFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "billing.foundation", owner: "apps/billing/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["billing.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
