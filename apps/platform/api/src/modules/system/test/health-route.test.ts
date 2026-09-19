import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { type ModuleProvider, ProviderEngine } from "@codexsun/framework";
import { registerHealthRoute } from "../routes/health-route.js";
import { configureApiSchemas } from "../../../openapi.js";

test("reports provider readiness without provider values", async () => {
  const engine = new ProviderEngine();
  const provider: ModuleProvider = {
    manifest: {
      id: "platform.test",
      owner: "apps/platform/api/modules/system/test",
      version: "1.0.2",
      dependencies: [],
      contracts: ["platform.test"],
      events: { published: [], consumed: [] },
    },
    register(): void {},
  };
  engine.register(provider);
  engine.start();

  const app = Fastify();
  configureApiSchemas(app);
  await registerHealthRoute(app, engine);
  const response = await app.inject({ method: "GET", url: "/api/v1/platform/health" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    status: "ok",
    providers: ["platform.test"],
    readiness: [{ id: "platform.test", state: "started" }],
  });
  const readiness = await app.inject({ method: "GET", url: "/healthz" });
  assert.equal(readiness.statusCode, 200);
  assert.deepEqual(readiness.json(), { status: "ok" });
  await app.close();
});
