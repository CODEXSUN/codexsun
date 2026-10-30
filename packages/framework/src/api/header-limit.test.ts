import assert from "node:assert/strict";
import test from "node:test";
import { request } from "node:http";
import { createApiApp } from "./create-api-app.js";

test("HTTP accepts multi-tab cookie headers but retains a bounded header limit", async () => {
  const app = await createApiApp({
    appName: "Header test",
    cookieSecret: "test-cookie-secret-with-32-characters",
    corsOrigins: [],
    environment: "test"
  });
  await app.listen({ host: "127.0.0.1", port: 0 });
  const address = app.server.address();
  assert.ok(address && typeof address !== "string");
  const status = (size: number) =>
    new Promise<number | undefined>((resolve, reject) => {
      const req = request(
        {
          host: "127.0.0.1",
          port: address.port,
          path: "/",
          headers: { cookie: "test=" + "a".repeat(size) }
        },
        (res) => {
          res.resume();
          resolve(res.statusCode);
        }
      );
      req.on("error", reject);
      req.end();
    });
  try {
    assert.equal(await status(24 * 1024), 200);
    assert.equal(await status(70 * 1024), 431);
  } finally {
    await app.close();
  }
});
