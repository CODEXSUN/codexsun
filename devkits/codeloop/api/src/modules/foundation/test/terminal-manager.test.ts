import test from "node:test";
import assert from "node:assert/strict";
import { TerminalManager } from "../terminal-manager.js";

test("TerminalManager.exec runs command and returns stdout and exitCode", async () => {
  const manager = new TerminalManager();
  const result = await manager.exec({
    command: 'node -e "console.log(\'codeloop terminal test\')"',
  });

  assert.equal(result.exitCode, 0);
  assert.equal(result.success, true);
  assert.match(result.stdout, /codeloop terminal test/);
  assert.equal(result.stderr, "");
  assert.ok(result.durationMs >= 0);
});

test("TerminalManager.exec fails gracefully on invalid command", async () => {
  const manager = new TerminalManager();
  const result = await manager.exec({
    command: 'node -e "process.exit(42)"',
  });

  assert.equal(result.exitCode, 42);
  assert.equal(result.success, false);
});

test("TerminalManager enforces workspace boundary for cwd", () => {
  const manager = new TerminalManager("E:\\codexsun\\codexsun");
  assert.throws(() => {
    manager.resolveSafeCwd("C:\\Windows\\System32");
  }, /outside workspace boundary/);
});

test("TerminalManager.background, output, and kill lifecycle", async () => {
  const manager = new TerminalManager();
  const proc = manager.background({
    command: 'node -e "console.log(\'bg task running\'); setInterval(() => {}, 1000);"',
  });

  assert.ok(proc.id.startsWith("proc-"));
  assert.equal(proc.status, "running");

  // Allow process to emit initial stdout
  await new Promise((resolve) => setTimeout(resolve, 300));

  const out = manager.output(proc.id);
  assert.ok(out);
  assert.match(out.stdout, /bg task running/);
  assert.equal(out.status, "running");

  const killResult = manager.kill(proc.id);
  assert.equal(killResult.killed, true);
  assert.equal(killResult.status, "killed");

  const finalOut = manager.output(proc.id);
  assert.ok(finalOut);
  assert.equal(finalOut.status, "killed");
});
