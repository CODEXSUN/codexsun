import type { ModuleProvider } from "@codexsun/framework";

export class AccountsFoundationProvider implements ModuleProvider {
  readonly manifest = { id: "accounts.foundation", owner: "apps/accounts/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["accounts.health"], events: { published: [], consumed: [] } };
  register(): void {}
}
