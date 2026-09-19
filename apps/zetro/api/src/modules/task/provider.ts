import type { ModuleProvider, ProviderLifecycleContext, ProviderRegistrationContext } from "@codexsun/framework";
import type { ZetroFinalBriefReader } from "@codexsun/zetro-contracts";
import { AgentTaskService } from "./task-service.js";
import { TaskStore } from "./task-store.js";

export class ZetroTaskProvider implements ModuleProvider {
  constructor(private readonly databasePath: string) {}

  readonly manifest = {
    id: "zetro.task",
    owner: "apps/zetro/api/modules/task",
    version: "1.0.22",
    dependencies: ["zetro.brief"],
    contracts: ["zetro.task"],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    context.provide("zetro.task", new AgentTaskService(new TaskStore(this.databasePath), context.require<ZetroFinalBriefReader>("zetro.brief")));
  }

  stop(context: ProviderLifecycleContext): void {
    context.require<AgentTaskService>("zetro.task").close();
  }
}
