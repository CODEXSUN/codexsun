import assert from "node:assert/strict";
import test from "node:test";
import { DokployProvider } from "../dokploy-adapter.js";
import { DeploymentProviderError } from "../provider.js";

const target = { id: "target-1", name: "local", address: "127.0.0.1", status: "ready", production: false, providerTargetId: "server-1" };
const application = { id: "application-1", name: "demo", source: { type: "compose" as const, composeFile: "services: {}" }, targetId: target.id, providerApplicationId: "compose-1", status: "created" };

test("maps compose deployment requests and response identifiers", async () => {
  const calls: { path: string; body: string }[] = [];
  const provider = new DokployProvider({ id: "provider-1", name: "local", kind: "dokploy", baseUrl: "http://127.0.0.1:3000/api", accessTokenReference: "DOKPLOY_TOKEN", secretProvider: { resolve: async () => "secret-token" }, request: async (input, init) => { const url = typeof input === "string" || input instanceof URL ? input : input.url; calls.push({ path: new URL(url).pathname, body: String(init?.body ?? "") }); return new Response(JSON.stringify({ composeId: "compose-1" }), { status: 200, headers: { "content-type": "application/json" } }); } });
  const result = await provider.deployApplication(application);
  assert.equal(result.status, "queued");
  assert.equal(calls[0]?.path, "/api/compose.deploy");
  assert.match(calls[0]?.body ?? "", /compose-1/u);
});

test("rejects insecure remote Dokploy URLs", () => assert.throws(() => new DokployProvider({ id: "provider-1", name: "remote", kind: "dokploy", baseUrl: "http://dokploy.example.com/api", accessTokenReference: "DOKPLOY_TOKEN", secretProvider: { resolve: async () => "token" } }), (error: unknown) => error instanceof DeploymentProviderError && error.code === "provider.insecure_url"));

test("does not call Dokploy when the token reference cannot resolve", async () => {
  let calls = 0;
  const provider = new DokployProvider({ id: "provider-1", name: "local", kind: "dokploy", baseUrl: "http://127.0.0.1:3000/api", accessTokenReference: "DOKPLOY_TOKEN", secretProvider: { resolve: async () => undefined }, request: async () => { calls += 1; return new Response("{}", { status: 200 }); } });
  assert.equal((await provider.healthCheck()).status, "unhealthy");
  assert.equal(calls, 0);
});
