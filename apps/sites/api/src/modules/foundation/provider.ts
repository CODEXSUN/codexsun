import type { ModuleProvider } from "@codexsun/framework";

export class SitesFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "sites.foundation", owner: "apps/sites/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["sites.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
