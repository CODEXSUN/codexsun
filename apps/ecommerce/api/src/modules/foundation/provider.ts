import type { ModuleProvider } from "@codexsun/framework";

export class EcommerceFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "ecommerce.foundation", owner: "apps/ecommerce/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["ecommerce.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
