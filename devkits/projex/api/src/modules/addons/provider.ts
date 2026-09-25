import type { ModuleProvider } from "@codexsun/framework";

export class ProjexAddonsProvider implements ModuleProvider {
  readonly manifest = {
    id: "projex.addons",
    owner: "devkits/projex/api/modules/addons",
    version: "1.0.0",
    dependencies: ["platform.core", "projex.foundation"],
    contracts: ["projex.addons.catalog"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
