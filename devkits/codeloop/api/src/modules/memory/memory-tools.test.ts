import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { MemoryTools } from "./memory-tools.js";

test("sqlite memory stores isolated task state, project state, and decisions", () => {
  const directory = mkdtempSync(join(tmpdir(), "codeloop-memory-"));
  const memory = new MemoryTools("sqlite", join(directory, "memory.sqlite"));
  assert.equal(memory.taskState("actor-a", "task-1"), null);
  memory.taskState("actor-a", "task-1", { phase: "implement", retries: 1 });
  memory.projectState("actor-a", "project-a", { framework: "react" });
  memory.decisions("actor-a", "project-a", { decision: "Use SQLite first", rationale: "The current runtime already owns SQLite." });
  assert.deepEqual(memory.taskState("actor-a", "task-1")?.value, { phase: "implement", retries: 1 });
  assert.equal(memory.taskState("actor-b", "task-1"), null);
  assert.equal(memory.decisions("actor-a", "project-a").length, 1);
  memory.close();
  rmSync(directory, { recursive: true, force: true });
});

test("json memory transport persists portable records and MariaDB reports its planned phase", () => {
  const directory = mkdtempSync(join(tmpdir(), "codeloop-memory-json-"));
  const path = join(directory, "memory.json");
  const first = new MemoryTools("json", path);
  first.projectState("actor-a", "project-a", { language: "typescript" });
  first.close();
  const second = new MemoryTools("json", path);
  assert.deepEqual(second.projectState("actor-a", "project-a")?.value, { language: "typescript" });
  assert.throws(() => new MemoryTools("mariadb", path).taskState("actor-a", "task-1"), /MariaDB memory transport/);
  second.close();
  rmSync(directory, { recursive: true, force: true });
});
