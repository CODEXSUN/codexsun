import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { registerRequestObservability } from "./request-observability.js";

test("propagates a safe correlation ID and replaces invalid values", async () => {
  const app = Fastify();
  registerRequestObservability(app);
  app.get("/health", async () => ({ status: "ok" }));

  const supplied = await app.inject({ method: "GET", url: "/health", headers: { "x-correlation-id": "release-42" } });
  const generated = await app.inject({ method: "GET", url: "/health", headers: { "x-correlation-id": "not safe!" } });
  await app.close();

  assert.equal(supplied.headers["x-correlation-id"], "release-42");
  assert.match(String(generated.headers["x-correlation-id"]), /^[0-9a-f-]{36}$/u);
});
