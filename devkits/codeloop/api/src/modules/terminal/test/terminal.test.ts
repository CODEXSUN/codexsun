import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { TerminalTools, TerminalToolError } from "../terminal-tools.js";

test("TerminalTools capabilities returns terminal tool definitions", () => {
  const tools = new TerminalTools();
  const caps = tools.capabilities();
  assert.deepEqual(caps.tools, [
    "terminal.exec",
    "terminal.background",
    "terminal.kill",
    "terminal.output",
  ]);
});

test("terminal.exec executes command synchronously and returns stdout", async () => {
  const tools = new TerminalTools();
  const res = await tools.exec('node -e "console.log(\'terminal.exec ok\')"');
  assert.equal(res.exitCode, 0);
  assert.equal(res.success, true);
  assert.match(res.stdout, /terminal.exec ok/);
  assert.equal(res.stderr, "");
  assert.ok(res.durationMs >= 0);
});

test("terminal.exec handles non-zero exit codes", async () => {
  const tools = new TerminalTools();
  const res = await tools.exec('node -e "process.exit(17)"');
  assert.equal(res.exitCode, 17);
  assert.equal(res.success, false);
});

test("terminal.exec rejects cwd outside workspace boundaries", async () => {
  const tools = new TerminalTools("E:\\codexsun\\codexsun");
  await assert.rejects(async () => {
    await tools.exec("dir", "C:\\Windows");
  }, (err: Error) => {
    assert.ok(err instanceof TerminalToolError);
    assert.equal(err.statusCode, 403);
    return true;
  });
});

test("terminal cwd boundary rejects sibling paths with the same prefix", () => {
  const tools = new TerminalTools(resolve(process.cwd(), "terminal-test-root"));
  assert.throws(() => tools.resolveSafeCwd(resolve(process.cwd(), "terminal-test-root-other")), /outside workspace boundary/u);
});

test("terminal.background, terminal.output, and terminal.kill lifecycle", async () => {
  const tools = new TerminalTools();
  const proc = tools.background('node -e "console.log(\'bg started\'); setInterval(() => {}, 1000);"');

  assert.ok(proc.id.startsWith("proc-"));
  assert.equal(proc.status, "running");

  // Wait for stdout
  await new Promise((r) => setTimeout(r, 300));

  const out = tools.output(proc.id);
  assert.match(out.stdout, /bg started/);
  assert.equal(out.status, "running");

  const killRes = tools.kill(proc.id);
  assert.equal(killRes.killed, true);
  assert.equal(killRes.status, "killed");

  const postKillOut = tools.output(proc.id);
  assert.equal(postKillOut.status, "killed");
});
