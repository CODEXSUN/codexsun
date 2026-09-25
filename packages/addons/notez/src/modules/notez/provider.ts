import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class NotezModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "notez.module",
    owner: "packages/addons/notez/modules/notez",
    version: "1.0.0",
    dependencies: ["notez.provider"],
    contracts: ["notez.v1"],
    events: { published: ["notez.note.created"], consumed: ["notez.note.updated"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
