import assert from "node:assert/strict";
import test from "node:test";
import { ProviderEngine } from "@codexsun/framework";
import Fastify from "fastify";
import { registerRootRoute } from "./root-route.js";

test("redirects a ready Platform API root to the frontend", async () => {
  const engine = createReadyEngine();
  const app = Fastify();
  registerRootRoute(app, engine, "http://127.0.0.1:6101");

  const response = await app.inject({ method: "GET", url: "/" });

  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "http://127.0.0.1:6101");
});

test("does not redirect when the Platform runtime is not ready", async () => {
  const engine = new ProviderEngine();
  const app = Fastify();
  registerRootRoute(app, engine, "http://127.0.0.1:6101");

  const response = await app.inject({ method: "GET", url: "/" });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), { status: "degraded" });
});

function createReadyEngine(): ProviderEngine {
  const engine = new ProviderEngine();
  engine.register({
    manifest: {
      id: "platform.core",
      owner: "apps/platform/api/test",
      version: "1.0.2",
      dependencies: [],
      contracts: [],
      events: { published: [], consumed: [] },
    },
    register(): void {},
  });
  engine.start();
  return engine;
}
