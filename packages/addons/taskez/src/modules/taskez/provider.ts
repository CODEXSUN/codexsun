import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";

export class TaskezModuleProvider implements ModuleProvider {
  readonly manifest = {
    id: "taskez.module",
    owner: "packages/addons/taskez/modules/taskez",
    version: "1.0.0",
    dependencies: ["taskez.provider"],
    contracts: ["taskez.v1"],
    events: { published: ["taskez.task.created"], consumed: ["taskez.task.completed"] },
  };

  register(_context: ProviderRegistrationContext): void {}
}
