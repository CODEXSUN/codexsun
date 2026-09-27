import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AgentRunStore } from "../agent-run-store.js";

test("agent runs persist ordered events and replay from a sequence", () => {
  const directory = mkdtempSync(join(tmpdir(), "codeloop-run-"));
  const store = new AgentRunStore(join(directory, "runs.sqlite"));
  store.initialize();
  const run = store.create("owner-1", "conversation-1");
  const first = store.append(run.id, "run_started", { message: "Working" });
  store.append(run.id, "activity", { phase: "thinking" });
  store.finish(run.id, "completed");
  const replay = store.get("owner-1", run.id, first.seq);
  assert.equal(replay?.status, "completed");
  assert.deepEqual(replay?.events.map((event) => event.type), ["activity"]);
  store.close();
  rmSync(directory, { recursive: true, force: true });
});
