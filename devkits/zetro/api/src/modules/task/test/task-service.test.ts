import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { ZetroCreateAgentTask, ZetroFinalBriefReader, ZetroPreparedTaskHandoff } from "@codexsun/zetro-contracts";
import Fastify from "fastify";
import { registerAgentTaskRoutes } from "../routes";
import { AgentTaskService } from "../task-service";
import { TaskStore } from "../task-store";

function input(briefId: string): ZetroCreateAgentTask {
  return { acceptanceCriteria: "Review approved", briefId, priority: "medium", projectReference: null, projectScope: "all-projects", summary: "Hand over the validated registry change.", title: "Registry handover" };
}

test("prepares a task only when its final brief has the same project scope", () => {
  const briefId = randomUUID();
  const reader: ZetroFinalBriefReader = { getFinalBrief: (id) => ({ audience: "Developers", constraints: "No task execution", conversationId: randomUUID(), createdAt: new Date().toISOString(), exclusions: "No source deletion", id, outcome: "A safe handover", projectReference: null, projectScope: "all-projects", risks: "Scope mismatch", scope: "Registry", sourceMessageIds: [], status: "final", successSignals: "Review approved", title: "Registry", updatedAt: new Date().toISOString() }) };
  const service = new AgentTaskService(new TaskStore(":memory:"), reader, { deliver: async () => ({ acceptedAt: new Date().toISOString(), idempotencyKey: randomUUID(), status: "accepted", zunoHandoffId: randomUUID() }) });
  try {
    assert.equal(service.createTask(input(briefId)).briefId, briefId);
    assert.throws(() => service.createTask({ ...input(randomUUID()), projectScope: "project", projectReference: "other" }), /must match/u);
  } finally {
    service.close();
  }
});

test("persists a Zuno receipt and returns the delivered task on retry", async () => {
  const briefId = randomUUID();
  const sourceMessageId = randomUUID();
  const reader: ZetroFinalBriefReader = { getFinalBrief: (id) => ({ audience: "Developers", constraints: "No task execution", conversationId: randomUUID(), createdAt: new Date().toISOString(), exclusions: "No source deletion", id, outcome: "A safe handoff", projectReference: null, projectScope: "all-projects", risks: "Scope mismatch", scope: "Registry", sourceMessageIds: [sourceMessageId], status: "final", successSignals: "Review approved", title: "Registry", updatedAt: new Date().toISOString() }) };
  const deliveries: ZetroPreparedTaskHandoff[] = [];
  const zunoHandoffId = randomUUID();
  const service = new AgentTaskService(new TaskStore(":memory:"), reader, { deliver: async (handoff) => {
    deliveries.push(handoff);
    return { acceptedAt: new Date().toISOString(), idempotencyKey: handoff.idempotencyKey, status: "accepted", zunoHandoffId };
  } });
  try {
    const task = service.createTask(input(briefId));
    const delivered = await service.deliverTask(task.id);
    assert.equal(delivered.status, "delivered");
    assert.equal(delivered.zunoHandoffId, zunoHandoffId);
    assert.equal((await service.deliverTask(task.id)).zunoHandoffId, zunoHandoffId);
    assert.equal(deliveries.length, 1);
  } finally {
    service.close();
  }
});

test("reports a missing prepared task as not found", async () => {
  const reader: ZetroFinalBriefReader = { getFinalBrief: () => { throw new Error("Not used."); } };
  const service = new AgentTaskService(new TaskStore(":memory:"), reader, { deliver: async () => { throw new Error("Not used."); } });
  const app = Fastify();
  await registerAgentTaskRoutes(app, service);
  try {
    const response = await app.inject({ method: "POST", url: `/api/zetro/v1/tasks/${randomUUID()}/deliver` });
    assert.equal(response.statusCode, 404);
    assert.equal(response.json().code, "zetro.task-not-found");
  } finally {
    await app.close();
    service.close();
  }
});
