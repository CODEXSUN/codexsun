import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { createServerShutdown } from "./server-shutdown.js";

test("closes a server only once when shutdown repeats", async () => {
  const app = Fastify();
  let closeCount = 0;
  app.addHook("onClose", () => {
    closeCount += 1;
  });

  const shutdown = createServerShutdown(app);
  await Promise.all([shutdown(), shutdown()]);

  assert.equal(closeCount, 1);
});
