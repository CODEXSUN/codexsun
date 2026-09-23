import type { ModuleProvider } from "@codexsun/framework";

export class OrshipFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "orship.foundation", owner: "devkits/orship/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["orship.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
