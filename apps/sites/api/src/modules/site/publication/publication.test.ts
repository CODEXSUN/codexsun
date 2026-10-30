import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { registerPublicationRoutes } from "./publication.routes.js";
test("deployment export rejects a denied action before reading or creating content", async () => {
  const app = Fastify();
  let checks = 0;
  registerPublicationRoutes(app, async () => {
    checks++;
    throw AppError.forbidden("Export denied.");
  });
  try {
    const response = await app.inject({
      method: "POST",
      url: "/sites/c0de0004/publication/export"
    });
    assert.equal(response.statusCode, 403);
    assert.equal(checks, 1);
  } finally {
    await app.close();
  }
});
