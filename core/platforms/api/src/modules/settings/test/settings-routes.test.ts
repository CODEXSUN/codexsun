import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { SettingsController } from "../controller/settings.controller.js";
import { InMemorySettingsRepository } from "../repository/settings.repository.js";
import { registerSettingsRoutes } from "../routes/settings-routes.js";
import { configureApiSchemas } from "../../../openapi.js";
import { SettingsService } from "../service/settings.service.js";

test("allows only actors with platform settings permission to read settings", async () => {
  const app = Fastify();
  configureApiSchemas(app);
  const controller = new SettingsController(
    new SettingsService(new InMemorySettingsRepository([{ key: "platform.name", value: "Aaran" }])),
  );
  await registerSettingsRoutes(app, controller, async (authorization) => {
    if (authorization === "Bearer operator") {
      return { id: "operator", kind: "service", roles: ["platform.operator"], permissions: ["platform.settings.read"] };
    }
    if (authorization === "Bearer member") return { id: "member", kind: "user", roles: [], permissions: [] };
    return undefined;
  });

  const missing = await app.inject({ method: "GET", url: "/api/v1/platform/settings" });
  assert.equal(missing.statusCode, 401);

  const forbidden = await app.inject({
    method: "GET",
    url: "/api/v1/platform/settings",
    headers: { authorization: "Bearer member" },
  });
  assert.equal(forbidden.statusCode, 403);

  const allowed = await app.inject({
    method: "GET",
    url: "/api/v1/platform/settings",
    headers: { authorization: "Bearer operator" },
  });
  assert.equal(allowed.statusCode, 200);
  assert.deepEqual(allowed.json(), { settings: [{ key: "platform.name", value: "Aaran" }] });
  await app.close();
});
