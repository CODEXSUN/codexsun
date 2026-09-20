import type { ModuleProvider } from "@codexsun/framework";

export class ZunoFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "zuno.foundation", owner: "apps/zuno/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["zuno.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
