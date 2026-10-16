import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import type { FastifyRequest } from "fastify";
import {
  assertLocalStorefrontControl,
  EcommerceStorefrontRuntime
} from "./overview.storefront-runtime.js";

test("runtime identifies the storefront rather than an unrelated server", async () => {
  const previousPort = process.env.CODEXSUN_ECOMMERCE_WEB_PORT;
  const previousMode = process.env.NODE_ENV;
  let app = "another-app";
  let broken = "";
  const server = createServer((request, response) => {
    if (request.headers.cookie === "large-browser-cookie") {
      response.writeHead(431);
      response.end();
      return;
    }
    if (request.url === broken) {
      response.writeHead(503);
      response.end();
      return;
    }
    if (request.url === "/shop") {
      response.setHeader("Content-Type", "text/html");
      response.end('<div id="root"></div>');
      return;
    }
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify(
        request.url?.includes("/branding")
          ? { success: true, data: { brandName: "Company" } }
          : request.url?.includes("/catalog")
            ? { success: true, data: [] }
            : { app }
      )
    );
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  process.env.CODEXSUN_ECOMMERCE_WEB_PORT = String(address.port);
  process.env.NODE_ENV = "test";
  try {
    const runtime = new EcommerceStorefrontRuntime();
    assert.equal((await runtime.status()).state, "stopped");
    app = "ecommerce-storefront";
    assert.equal((await runtime.status()).state, "running");
    broken = "/shop";
    assert.equal((await runtime.status()).state, "unhealthy");
    broken = "/api/platform/storefront/branding";
    assert.equal((await runtime.status()).state, "unhealthy");
    broken = "/api/platform/storefront/catalog?limit=1";
    assert.equal((await runtime.status()).state, "unhealthy");
    broken = "";
    assert.equal((await runtime.status("large-browser-cookie")).state, "unhealthy");
    process.env.NODE_ENV = "production";
    assert.equal((await runtime.status()).state, "unavailable");
  } finally {
    if (previousPort === undefined) delete process.env.CODEXSUN_ECOMMERCE_WEB_PORT;
    else process.env.CODEXSUN_ECOMMERCE_WEB_PORT = previousPort;
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    await new Promise<void>((done, reject) =>
      server.close((error) => (error ? reject(error) : done()))
    );
  }
});

test("remote callers and non-local hostnames cannot control the shared development process", () => {
  const request = (hostname: string, remoteAddress: string) =>
    ({
      hostname,
      raw: { socket: { remoteAddress } }
    }) as Pick<FastifyRequest, "hostname" | "raw">;
  assert.throws(() => assertLocalStorefrontControl(request("localhost", "192.168.1.20")));
  assert.throws(() => assertLocalStorefrontControl(request("shop.example.com", "127.0.0.1")));
});
