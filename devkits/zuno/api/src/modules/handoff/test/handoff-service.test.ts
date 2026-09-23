import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { ZetroPreparedTaskHandoff } from "@codexsun/zetro-contracts";
import Fastify from "fastify";
import { HandoffConflictError, ZunoHandoffService } from "../handoff-service";
import { ZunoHandoffStore } from "../handoff-store";
import { registerZetroHandoffRoutes } from "../routes";

function handoff(): ZetroPreparedTaskHandoff {
  const taskId = randomUUID();
  const project = { projectReference: null, projectScope: "all-projects" as const };
  return {
    brief: { audience: "Product teams", constraints: "No execution in Zetro", exclusions: "Repository work", id: randomUUID(), outcome: "A durable handoff", risks: "Scope drift", scope: "Idea delivery", sourceMessageIds: [randomUUID()], successSignals: "Zuno accepts one package", title: "Durable handoff", updatedAt: new Date().toISOString(), ...project },
    idempotencyKey: taskId,
    kind: "zetro.prepared-task",
    preparedAt: new Date().toISOString(),
    source: "zetro",
    target: "zuno",
    task: { acceptanceCriteria: "Zuno returns a receipt", id: taskId, priority: "medium", summary: "Deliver the final brief", title: "Deliver brief", ...project },
    version: 1,
  };
}

test("returns one durable receipt for repeated handoff delivery", () => {
  const service = new ZunoHandoffService(new ZunoHandoffStore(":memory:"));
  const input = handoff();
  try {
    const first = service.accept(input);
    assert.deepEqual(service.accept(input), first);
    assert.deepEqual(service.list(), [{ acceptedAt: first.acceptedAt, handoff: input, zunoHandoffId: first.zunoHandoffId }]);
  } finally {
    service.close();
  }
});

test("rejects a changed payload that reuses an idempotency key", () => {
  const service = new ZunoHandoffService(new ZunoHandoffStore(":memory:"));
  const input = handoff();
  try {
    service.accept(input);
    assert.throws(() => service.accept({ ...input, task: { ...input.task, summary: "Changed after delivery" } }), HandoffConflictError);
  } finally {
    service.close();
  }
});

test("requires the Zetro service key before it accepts a handoff", async () => {
  const app = Fastify();
  const service = new ZunoHandoffService(new ZunoHandoffStore(":memory:"));
  registerZetroHandoffRoutes(app, service, "test-zetro-client-key-with-32-characters");
  try {
    const unauthorized = await app.inject({ body: handoff(), method: "POST", url: "/api/v1/zuno/handoffs/zetro" });
    assert.equal(unauthorized.statusCode, 401);
    const accepted = await app.inject({ body: handoff(), headers: { "x-zetro-client-key": "test-zetro-client-key-with-32-characters" }, method: "POST", url: "/api/v1/zuno/handoffs/zetro" });
    assert.equal(accepted.statusCode, 200);
    const inbox = await app.inject({ method: "GET", url: "/api/v1/zuno/handoffs/zetro" });
    assert.equal(inbox.statusCode, 200);
    assert.equal(inbox.json().data.handoffs.length, 1);
  } finally {
    await app.close();
    service.close();
  }
});
