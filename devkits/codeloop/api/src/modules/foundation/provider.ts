import type { ModuleProvider } from "@codexsun/framework";

export class CodeloopFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "codeloop.foundation", owner: "devkits/codeloop/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["codeloop.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
