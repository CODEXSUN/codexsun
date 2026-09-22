import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { ProviderEngine } from "@codexsun/framework";
import { PlatformProvider } from "@codexsun/platform-core";
import { ZetroFoundationProvider } from "../provider.js";
import { registerZetroHealthRoute } from "../routes/zetro-health-route.js";

test("returns the public Zetro health envelope", async () => {
  const engine = new ProviderEngine();
  engine.register(new PlatformProvider());
  engine.register(new ZetroFoundationProvider());
  engine.register({
    manifest: {
      id: "zetro.storage",
      owner: "apps/devkits/zetro/api/modules/storage",
      version: "1.0.9",
      dependencies: ["platform.core"],
      contracts: ["zetro.sqlite"],
      events: { published: [], consumed: [] },
    },
    register(context) {
      context.provide("zetro.sqlite", { check: async () => true });
    },
  });
  engine.start();

  const app = Fastify();
  await registerZetroHealthRoute(app, engine);
  const response = await app.inject({ method: "GET", url: "/api/zetro/v1/health" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    data: {
      database: "ok",
      providers: ["platform.core", "zetro.foundation", "zetro.storage"],
      service: "zetro",
      status: "ok",
    },
    version: "v1",
  });
  await app.close();
  engine.stop();
});
