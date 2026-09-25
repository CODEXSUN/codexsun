import type { ModuleProvider } from "@codexsun/framework";

export class ProjexWorkspaceProvider implements ModuleProvider {
  readonly manifest = {
    id: "projex.workspace",
    owner: "devkits/projex/api/modules/workspace",
    version: "1.0.0",
    dependencies: ["platform.core", "projex.foundation"],
    contracts: ["projex.workspace.snapshot"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
