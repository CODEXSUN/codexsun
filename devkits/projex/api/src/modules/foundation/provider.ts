import type { ModuleProvider } from "@codexsun/framework";

export class ProjexFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "projex.foundation", owner: "devkits/projex/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["projex.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
