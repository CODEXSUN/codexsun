import type { ModuleProvider } from "@codexsun/framework";

export class OrshipInfrasProvider implements ModuleProvider {
  readonly manifest = {
    id: "orship.infras",
    owner: "devkits/orship/api/modules/infras",
    version: "1.0.0",
    dependencies: ["platform.core"],
    contracts: ["orship.infras"],
    events: { published: [], consumed: [] },
  };

  register(): void {}
}
