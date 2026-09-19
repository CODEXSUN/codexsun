import type { ModuleProvider } from "@codexsun/framework";

export class LmsFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "lms.foundation", owner: "apps/lms/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["lms.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
