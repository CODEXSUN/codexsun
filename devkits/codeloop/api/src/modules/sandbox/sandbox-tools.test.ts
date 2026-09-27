import assert from "node:assert/strict";
import test from "node:test";
import { SandboxTools } from "./sandbox-tools.js";

test("sandbox tools expose the isolated Docker lifecycle", () => {
  const tools = new SandboxTools(process.cwd(), "docker-not-used-by-this-test");
  assert.deepEqual(tools.capabilities().tools, ["sandbox.create", "sandbox.start", "sandbox.exec", "sandbox.stop", "sandbox.destroy", "sandbox.snapshot", "sandbox.restore"]);
  assert.throws(() => tools.create("../unsafe"), /Sandbox names/u);
  assert.throws(() => tools.create("safe", "bad image"), /Sandbox image/u);
});
