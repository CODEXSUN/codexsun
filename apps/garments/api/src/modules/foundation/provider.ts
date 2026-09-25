import type { ModuleProvider } from "@codexsun/framework";

export class GarmentsFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "garments.foundation", owner: "apps/garments/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["garments.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
