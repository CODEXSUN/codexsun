import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { ZetroCreateAgentTask, ZetroFinalBriefReader } from "@codexsun/zetro-contracts";
import { AgentTaskService } from "../task-service.js";
import { TaskStore } from "../task-store.js";

function input(briefId: string): ZetroCreateAgentTask {
  return { acceptanceCriteria: "Review approved", briefId, priority: "medium", projectReference: null, projectScope: "all-projects", summary: "Hand over the validated registry change.", title: "Registry handover" };
}

test("prepares a task only when its final brief has the same project scope", () => {
  const briefId = randomUUID();
  const reader: ZetroFinalBriefReader = { getFinalBrief: (id) => ({ audience: "Developers", constraints: "No task execution", conversationId: randomUUID(), createdAt: new Date().toISOString(), exclusions: "No source deletion", id, outcome: "A safe handover", projectReference: null, projectScope: "all-projects", risks: "Scope mismatch", scope: "Registry", sourceMessageIds: [], status: "final", successSignals: "Review approved", title: "Registry", updatedAt: new Date().toISOString() }) };
  const service = new AgentTaskService(new TaskStore(":memory:"), reader);
  try {
    assert.equal(service.createTask(input(briefId)).briefId, briefId);
    assert.throws(() => service.createTask({ ...input(randomUUID()), projectScope: "project", projectReference: "other" }), /must match/u);
  } finally {
    service.close();
  }
});
