import type { ModuleProvider } from "@codexsun/framework";

export class HimsxFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "himsx.foundation", owner: "apps/himsx/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["himsx.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
