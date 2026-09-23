import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";
import { ZetroSqliteReadiness } from "./zetro-sqlite-readiness";

export class ZetroStorageProvider implements ModuleProvider {
  constructor(private readonly databasePath: string) {}

  readonly manifest = {
    id: "zetro.storage",
    owner: "devkits/zetro/api/modules/storage",
    version: "1.0.22",
    dependencies: ["platform.core"],
    contracts: ["zetro.sqlite"],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    context.provide("zetro.sqlite", new ZetroSqliteReadiness(this.databasePath));
  }
}
