import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { ProviderEngine } from "@codexsun/framework";
import { PlatformProvider } from "@codexsun/platform-core";
import { DocsCatalogProvider } from "../provider.js";
import { registerDocsHealthRoute } from "../routes/docs-health-route.js";

test("returns the public Docs health envelope", async () => {
  const engine = new ProviderEngine();
  engine.register(new PlatformProvider());
  engine.register(new DocsCatalogProvider());
  engine.start();

  const app = Fastify();
  await registerDocsHealthRoute(app, engine);
  const response = await app.inject({ method: "GET", url: "/api/docs/v1/health" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    data: { providers: ["docs.catalog", "platform.core"], service: "docs", status: "ok" },
    version: "v1",
  });
  await app.close();
  engine.stop();
});
