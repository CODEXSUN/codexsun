import type { ModuleProvider } from "@codexsun/framework";

export class SitesWorkspaceProvider implements ModuleProvider {
  readonly manifest = {
    id: "sites.workspace",
    owner: "apps/sites/api/modules/workspace",
    version: "1.0.0",
    dependencies: ["platform.core", "sites.foundation", "sites.content"],
    contracts: ["sites.client-workspace", "sites.deployment"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
