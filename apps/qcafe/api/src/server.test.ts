import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { QcafeFoundationProvider } from "./modules/foundation/provider.js";
import { registerQcafeWorkspaceRoute } from "./modules/foundation/routes/qcafe-workspace-route.js";

test("qcafe API declares its owned health contract", () => {
  const provider = new QcafeFoundationProvider();
  assert.deepEqual(provider.manifest.contracts, [
    "qcafe.health",
    "qcafe.foundation.setup.v1",
    "qcafe.foundation.activity.v1",
  ]);
  assert.equal(provider.manifest.owner, "apps/qcafe/api/modules/foundation");
});

test("qcafe workspace route returns first navigation pages", async () => {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await registerQcafeWorkspaceRoute(app, ["platform.core", "qcafe.foundation"]);

  const response = await app.inject({ method: "GET", url: "/api/v1/qcafe/workspace" });
  const body = response.json();

  assert.equal(response.statusCode, 200);
  assert.equal(body.status, "ok");
  assert.deepEqual(
    body.pages.map((page: { id: string; label: string }) => [page.id, page.label]),
    [
      ["overview", "Overview"],
      ["setup", "Business setup"],
      ["menu", "Menu setup"],
      ["pos", "POS"],
      ["kot", "KOT"],
      ["booking", "Booking"],
    ],
  );
  assert.deepEqual(body.providers, ["platform.core", "qcafe.foundation"]);
});
