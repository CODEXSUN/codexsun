import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { registerHttpSecurity } from "./http-security.js";

test("allows the configured web origin and sets Helmet response headers", async () => {
  const app = Fastify();
  await registerHttpSecurity(app, "http://127.0.0.1:6101");
  app.get("/health", async () => ({ status: "ok" }));

  const preflight = await app.inject({
    method: "OPTIONS",
    url: "/health",
    headers: {
      origin: "http://127.0.0.1:6101",
      "access-control-request-method": "GET",
    },
  });
  const response = await app.inject({ method: "GET", url: "/health", headers: { origin: "http://127.0.0.1:6101" } });

  assert.equal(preflight.statusCode, 204);
  assert.equal(preflight.headers["access-control-allow-origin"], "http://127.0.0.1:6101");
  assert.equal(response.headers["access-control-allow-origin"], "http://127.0.0.1:6101");
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.match(response.headers["content-security-policy"] ?? "", /default-src 'self'/u);
});
