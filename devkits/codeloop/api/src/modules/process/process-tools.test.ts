import assert from "node:assert/strict";
import test from "node:test";
import { TerminalTools } from "../terminal/terminal-tools.js";
import { ProcessTools } from "./process-tools.js";

test("process tools manage named services and expose logs", async () => {
  const terminal = new TerminalTools(process.cwd());
  const tools = new ProcessTools(terminal);
  const command = "node -e \"console.log('service-ready'); setInterval(() => {}, 1000)\"";
  const started = tools.start({ name: "api", command });
  assert.equal(started.name, "api");
  assert.equal(started.status, "running");
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.match(tools.logs("api").stdout, /service-ready/u);
  assert.equal((tools.status("api") as { status: string }).status, "running");
  assert.equal(tools.stop("api").killed, true);
  assert.equal((tools.status("api") as { status: string }).status, "killed");
});

test("process tools reject unsafe service names", () => {
  const tools = new ProcessTools(new TerminalTools(process.cwd()));
  assert.throws(() => tools.start({ name: "../api", command: "node -e \"\"" }), /Process service names/u);
});
