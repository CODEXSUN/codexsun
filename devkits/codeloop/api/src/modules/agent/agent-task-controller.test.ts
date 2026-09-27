import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { MemoryTools } from "../memory/memory-tools.js";
import { AgentTaskController } from "./agent-task-controller.js";

test("agent task controller persists checkpoint, validation, retry, and completion state", () => {
  const directory = mkdtempSync(join(tmpdir(), "codeloop-task-"));
  const memory = new MemoryTools("sqlite", join(directory, "memory.sqlite"));
  let checkpoints = 0;
  const controller = new AgentTaskController(memory, { createCheckpoint: () => ({ id: `checkpoint-${++checkpoints}` }), rollback: () => ({ rolledBack: true }) });
  const planned = controller.create("actor-a", { title: "Fix login", prompt: "Repair the login test." });
  assert.equal(planned.status, "planned");
  const running = controller.start("actor-a", planned.id);
  assert.equal(running.status, "running");
  assert.equal(running.checkpointId, "checkpoint-1");
  controller.beginValidation("actor-a", planned.id);
  const retrying = controller.recordValidation("actor-a", planned.id, { success: false, errors: ["test failed"] });
  assert.equal(retrying.status, "retrying");
  const restarted = controller.start("actor-a", planned.id);
  assert.equal(restarted.status, "running");
  controller.beginValidation("actor-a", planned.id);
  const completed = controller.recordValidation("actor-a", planned.id, { success: true, stages: { tests: "passed" } });
  assert.equal(completed.status, "completed");
  assert.equal(controller.get("actor-a", planned.id)?.attempt, 2);
  assert.equal(controller.get("actor-b", planned.id), null);
  memory.close();
  rmSync(directory, { recursive: true, force: true });
});

test("agent task controller rolls back a failed task and rejects invalid transitions", () => {
  const directory = mkdtempSync(join(tmpdir(), "codeloop-task-rollback-"));
  const memory = new MemoryTools("json", join(directory, "memory.json"));
  let rollbackId = "";
  const controller = new AgentTaskController(memory, { createCheckpoint: () => ({ id: "checkpoint-rollback" }), rollback: (id) => { rollbackId = id; return { rolledBack: true }; } });
  const task = controller.create("actor-a", { title: "Rollback me", prompt: "A controlled failure." });
  assert.throws(() => controller.beginValidation("actor-a", task.id), /cannot validate/);
  controller.start("actor-a", task.id);
  const rolledBack = controller.rollback("actor-a", task.id);
  assert.equal(rolledBack.status, "rolled_back");
  assert.equal(rollbackId, "checkpoint-rollback");
  assert.throws(() => controller.start("actor-a", task.id), /cannot start/);
  memory.close();
  rmSync(directory, { recursive: true, force: true });
});

test("agent task controller automatically records validation and rolls back after the retry limit", async () => {
  const directory = mkdtempSync(join(tmpdir(), "codeloop-task-validation-"));
  const memory = new MemoryTools("sqlite", join(directory, "memory.sqlite"));
  let rollbackCount = 0;
  const controller = new AgentTaskController(memory, { createCheckpoint: () => ({ id: "checkpoint-validation" }), rollback: () => { rollbackCount += 1; return { rolledBack: true }; } });
  const task = controller.create("actor-a", { title: "Validate me", prompt: "Run the validator.", maxAttempts: 1 });
  controller.start("actor-a", task.id);
  const result = await controller.validateAndTransition("actor-a", task.id, async () => ({ success: false, errors: [{ stage: "typecheck", message: "failed" }] }));
  assert.equal(result.task.status, "rolled_back");
  assert.equal(result.validation.success, false);
  assert.equal(rollbackCount, 1);
  memory.close();
  rmSync(directory, { recursive: true, force: true });
});
