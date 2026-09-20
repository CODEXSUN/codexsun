import type { ZetroAgentTask, ZetroCreateAgentTask, ZetroFinalBriefReader, ZetroPreparedTaskHandoff } from "@codexsun/zetro-contracts";
import { TaskStore } from "./task-store.js";
import type { ZetroHandoffDelivery } from "./zuno-handoff-client.js";

export class AgentTaskNotFoundError extends Error {
  constructor() {
    super("Prepared task not found.");
  }
}

export class AgentTaskService {
  constructor(private readonly store: TaskStore, private readonly briefs: ZetroFinalBriefReader, private readonly delivery: ZetroHandoffDelivery) {}

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

  async deliverTask(id: string): Promise<ZetroAgentTask> {
    const task = this.store.get(id);
    if (!task) throw new AgentTaskNotFoundError();
    if (task.status === "delivered") return task;
    const handoff = this.store.deliveryPayload(id) ?? createHandoff(task, this.briefs.getFinalBrief(task.briefId));
    this.store.beginDelivery(id, handoff);
    try {
      return this.store.markDelivered(id, await this.delivery.deliver(handoff));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Zuno could not accept the handoff.";
      this.store.markFailed(id, message);
      throw error;
    }
  }

  close(): void {
    this.store.close();
  }
}

function createHandoff(task: ZetroAgentTask, brief: ReturnType<ZetroFinalBriefReader["getFinalBrief"]>): ZetroPreparedTaskHandoff {
  return {
    brief: {
      audience: brief.audience,
      constraints: brief.constraints,
      exclusions: brief.exclusions,
      id: brief.id,
      outcome: brief.outcome,
      projectReference: brief.projectReference,
      projectScope: brief.projectScope,
      risks: brief.risks,
      scope: brief.scope,
      sourceMessageIds: brief.sourceMessageIds,
      successSignals: brief.successSignals,
      title: brief.title,
      updatedAt: brief.updatedAt,
    },
    idempotencyKey: task.id,
    kind: "zetro.prepared-task",
    preparedAt: task.createdAt,
    source: "zetro",
    target: "zuno",
    task: {
      acceptanceCriteria: task.acceptanceCriteria,
      id: task.id,
      priority: task.priority,
      projectReference: task.projectReference,
      projectScope: task.projectScope,
      summary: task.summary,
      title: task.title,
    },
    version: 1,
  };
}
