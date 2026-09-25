import type { ModuleProvider } from "@codexsun/framework";

export class SitesContentProvider implements ModuleProvider {
  readonly manifest = { id: "sites.content", owner: "apps/sites/api/modules/content", version: "1.0.0", dependencies: ["platform.core", "sites.foundation"], contracts: ["sites.public-content"], events: { published: [], consumed: [] } };
  register(): void {}
}
