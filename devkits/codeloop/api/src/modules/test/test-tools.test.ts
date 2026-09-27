import assert from "node:assert/strict";
import test from "node:test";
import { TerminalTools } from "../terminal/terminal-tools.js";
import { TestTools } from "./test-tools.js";

test("test tools expose explicit modes and run within the terminal boundary", async () => {
  const tools = new TestTools(new TerminalTools(process.cwd()));
  assert.deepEqual(tools.capabilities().tools, ["test.run", "test.unit", "test.integration", "test.e2e", "test.watch", "test.coverage"]);

  const result = await tools.run("test.unit", "node -e \"process.stdout.write('unit-ok')\"", ".");
  assert.equal(result.tool, "test.unit");
  assert.equal(result.success, true);
  assert.match(result.stdout, /unit-ok/u);
});

test("test watcher uses the bounded terminal process lifecycle", async () => {
  const terminal = new TerminalTools(process.cwd());
  const tools = new TestTools(terminal);
  const result = tools.watch('node -e "setInterval(() => {}, 1000)"');
  assert.equal(result.tool, "test.watch");
  assert.equal(result.status, "running");
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(terminal.kill(result.id).killed, true);
});
