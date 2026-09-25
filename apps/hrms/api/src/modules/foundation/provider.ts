import type { ModuleProvider } from "@codexsun/framework";

export class HrmsFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "hrms.foundation", owner: "apps/hrms/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["hrms.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
