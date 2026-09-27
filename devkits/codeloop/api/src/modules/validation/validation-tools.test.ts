import assert from "node:assert/strict";
import test from "node:test";
import { TerminalTools } from "../terminal/terminal-tools.js";
import { ValidationTools } from "./validation-tools.js";

const pass = "node -e \"process.exit(0)\"";

test("validate runs all stages and returns structured success", async () => {
  const tools = new ValidationTools(new TerminalTools(process.cwd()));
  const result = await tools.validate(".", { typecheck: pass, lint: pass, unit: pass, integration: pass, e2e: pass, build: pass });

  assert.equal(result.success, true);
  assert.equal(result.typecheck, "passed");
  assert.equal(result.lint, "passed");
  assert.equal(result.tests, "passed");
  assert.deepEqual(result.testStages, { unit: "passed", integration: "passed", e2e: "passed" });
  assert.equal(result.build, "passed");
  assert.deepEqual(result.errors, []);
});

test("validate stops at the first failed stage and marks later stages not_run", async () => {
  const tools = new ValidationTools(new TerminalTools(process.cwd()));
  const result = await tools.validate(".", { typecheck: pass, lint: "node -e \"process.exit(3)\"", unit: pass, build: pass });

  assert.equal(result.success, false);
  assert.equal(result.typecheck, "passed");
  assert.equal(result.lint, "failed");
  assert.equal(result.tests, "not_run");
  assert.equal(result.build, "not_run");
  assert.equal(result.errors[0]?.stage, "lint");
  assert.equal(result.errors[0]?.exitCode, 3);
});
