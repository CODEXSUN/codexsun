import test from "node:test";
import assert from "node:assert/strict";
import { authorize, loadConfig, parseJson } from "../src/config.mjs";
import { createSshProvider } from "../src/ssh-provider.mjs";
import { createMcpServer } from "../src/stdio-server.mjs";

const baseEnv = { CODEXSUN_MCP_API_TOKEN: "a-secure-development-token" };

test("config requires an API token and parses isolated SSH targets", () => {
  const config = loadConfig({ ...baseEnv, CODEXSUN_MCP_SSH_TARGETS: '{"prod":{"host":"example.test","user":"deploy"}}' });
  assert.equal(config.sshTargets.prod.host, "example.test");
  assert.throws(() => loadConfig({}), /API_TOKEN/);
  assert.deepEqual(parseJson("", {}), {});
});

test("request-token mode rejects missing and accepts bearer token", () => {
  const config = loadConfig({ ...baseEnv, CODEXSUN_MCP_REQUIRE_REQUEST_TOKEN: "1" });
  assert.equal(authorize({ params: {} }, config), false);
  assert.equal(authorize({ params: { _meta: { authorization: `Bearer ${baseEnv.CODEXSUN_MCP_API_TOKEN}` } } }, config), true);
  assert.equal(authorize({ params: { _meta: { authorization: "Bearer wrong-token" } } }, config), false);
});

test("SSH provider only runs exact configured commands", async () => {
  const calls = [];
  const config = { repositoryRoot: process.cwd(), sshTargets: { prod: { host: "example.test", user: "deploy" } }, sshAllowedCommands: { prod: ["docker compose ps"] } };
  const provider = createSshProvider(config, async (...args) => { calls.push(args); return { exitCode: 0, output: "ok" }; });
  assert.deepEqual(await provider.exec("prod", "docker compose ps"), { exitCode: 0, output: "ok" });
  assert.equal(calls[0][0], "ssh");
  await assert.rejects(() => provider.exec("prod", "rm -rf /"), /allowlisted/);
});

test("MCP server exposes tools and returns structured failures", async () => {
  const config = { apiToken: baseEnv.CODEXSUN_MCP_API_TOKEN, requireRequestToken: false, repositoryRoot: process.cwd(), appMode: "development", auditPath: "ignored", sshTargets: {}, sshAllowedCommands: {} };
  const server = createMcpServer({ config, sshProvider: { targets: () => [], exec: async () => ({}) }, registry: { loadRegistry: () => ({ applications: [{ id: "demo", label: "Demo", owner: "apps/demo", category: "business" }] }), verifyRegistry: () => ({ applications: ["demo"] }) }, audit: async () => {} });
  const list = await server.handle({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  assert.ok(list.result.tools.some((tool) => tool.name === "cloud.ssh.exec"));
  const failure = await server.handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "missing", arguments: {} } });
  assert.equal(failure.error.code, -32002);
});
