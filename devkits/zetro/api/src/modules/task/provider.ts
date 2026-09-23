import type { ModuleProvider, ProviderLifecycleContext, ProviderRegistrationContext } from "@codexsun/framework";
import type { ZetroFinalBriefReader } from "@codexsun/zetro-contracts";
import { AgentTaskService } from "./task-service";
import { TaskStore } from "./task-store";
import { ZunoHandoffClient } from "./zuno-handoff-client";

export class ZetroTaskProvider implements ModuleProvider {
  constructor(private readonly databasePath: string, private readonly zunoApiUrl: string, private readonly zunoClientKey: string) {}

  readonly manifest = {
    id: "zetro.task",
    owner: "devkits/zetro/api/modules/task",
    version: "1.0.22",
    dependencies: ["zetro.brief"],
    contracts: ["zetro.task"],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    context.provide("zetro.task", new AgentTaskService(new TaskStore(this.databasePath), context.require<ZetroFinalBriefReader>("zetro.brief"), new ZunoHandoffClient(this.zunoApiUrl, this.zunoClientKey)));
  }

  stop(context: ProviderLifecycleContext): void {
    context.require<AgentTaskService>("zetro.task").close();
  }
}
