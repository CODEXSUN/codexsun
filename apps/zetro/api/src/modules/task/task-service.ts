import type { ZetroAgentTask, ZetroCreateAgentTask, ZetroFinalBriefReader } from "@codexsun/zetro-contracts";
import { TaskStore } from "./task-store.js";

export class AgentTaskService {
  constructor(private readonly store: TaskStore, private readonly briefs: ZetroFinalBriefReader) {}

  listTasks(): ZetroAgentTask[] {
    return this.store.list();
  }

  createTask(input: ZetroCreateAgentTask): ZetroAgentTask {
    const brief = this.briefs.getFinalBrief(input.briefId);
    if (brief.projectScope !== input.projectScope || brief.projectReference !== input.projectReference) {
      throw new Error("The task project scope must match the finalized brief.");
    }
    return this.store.create(input);
  }

  close(): void {
    this.store.close();
  }
}
