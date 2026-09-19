import type { ModuleProvider } from "@codexsun/framework";

export class CrmFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "crm.foundation", owner: "apps/crm/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["crm.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
