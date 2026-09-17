import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { createPlatformRuntime } from "@codexsun/platform-core";
import { OrshipOrchestrationProvider } from "../provider.js";
import { registerOrchestrationRoutes } from "../routes/orchestration-routes.js";

test("the Orship health route reports its standalone provider composition", async () => {
  const runtime = createPlatformRuntime(
    { id: "orship.test", enabledProviderIds: ["platform.core", "orship.orchestration"] },
    [new OrshipOrchestrationProvider()],
  );
  runtime.start();
  const app = Fastify();
  await registerOrchestrationRoutes(app, runtime.engine);

  const response = await app.inject("/api/v1/orship/health");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().providers, [
    { id: "orship.orchestration", state: "started" },
    { id: "platform.core", state: "started" },
  ]);

  await app.close();
  runtime.stop();
});
