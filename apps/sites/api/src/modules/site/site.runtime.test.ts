import assert from "node:assert/strict";
import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import test, { after } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
const testDirectory = mkdtempSync(resolve(tmpdir(), "codexsun-sites-runtime-"));
after(() =>
  rmSync(testDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
);
import { resolve } from "node:path";
import { SiteRuntimeService, validateRuntimeSite, findSitesCheckout } from "./site.runtime.js";
import type { CmsSite } from "./site.types.js";

const site: CmsSite = {
  uuid: "c0de0001",
  id: 1,
  name: "Ramutex",
  slug: "ramutex",
  port: 17130,
  themeKey: "portfolio-ramutex",
  status: "active",
  primaryDomain: "ramutex.localhost",
  description: "",
  createdAt: "",
  updatedAt: "",
  publishedPages: 0
};

test("finds the checkout from source, built output and the host API working directory", () => {
  const root = resolve(import.meta.dirname, "../../../../../..");
  for (const directory of [
    import.meta.dirname,
    resolve(root, "dist/apps/sites/api/modules/site"),
    resolve(root, "apps/platform/api")
  ]) {
    assert.equal(findSitesCheckout([directory]), root);
  }
  assert.throws(() => findSitesCheckout([]), /Cannot locate/);
});

test("rejects unsupported commands, inactive sites, and unsafe ports", () => {
  for (const input of [
    { ...site, slug: "../platform" },
    { ...site, themeKey: "unknown" },
    { ...site, status: "suspended" as const },
    { ...site, port: 80 },
    { ...site, port: 65536 },
    { ...site, port: 7130.5 }
  ])
    assert.throws(() => validateRuntimeSite(input));
});

test(
  "starts a real isolated client and reports its verified identity",
  { timeout: 30000 },
  async () => {
    const port = await unusedPort();
    const runtime = new SiteRuntimeService({ dataRoot: testDirectory });
    try {
      const input = { ...site, port };
      const [first, second] = await Promise.all([runtime.start(input), runtime.start(input)]);
      assert.deepEqual(first, second);
      assert.equal(first.state, "running");
      assert.equal(first.port, port);
      const response = await fetch(`${first.url}/__codexsun_sites_identity`);
      assert.equal((await response.json()).client, "ramutex");
      const largeHeaders = await fetch(`${first.url}/__codexsun_sites_identity`, {
        headers: { Cookie: `local_preview=${"x".repeat(32768)}` }
      });
      assert.equal(largeHeaders.status, 200);
      assert.equal((await largeHeaders.json()).client, "ramutex");
      assert.deepEqual(await runtime.start(input), first);
    } finally {
      runtime.close();
    }
  }
);

async function unusedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test port allocated.");
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
  return address.port;
}

test(
  "starts a new client's standard template with its own identity",
  { timeout: 30000 },
  async () => {
    const runtime = new SiteRuntimeService({ dataRoot: testDirectory });
    try {
      const result = await runtime.start({
        ...site,
        slug: "new-client",
        themeKey: "portfolio-standard",
        port: await unusedPort()
      });
      const response = await fetch(`${result.url}/__codexsun_sites_identity`);
      assert.equal((await response.json()).client, "new-client");
      const home = await fetch(result.url);
      assert.equal(home.status, 200);
    } finally {
      runtime.close();
    }
  }
);

test(
  "an occupied port serving another site is not reported as ready",
  { timeout: 30000 },
  async () => {
    const server = createHttpServer((_request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ client: "another-site" }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("No test port allocated.");
    const runtime = new SiteRuntimeService({ dataRoot: testDirectory });
    try {
      await assert.rejects(runtime.start({ ...site, port: address.port }), /could not start/);
      assert.equal((await fetch(`http://127.0.0.1:${address.port}`)).status, 200);
    } finally {
      runtime.close();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  }
);

test(
  "starts the Tirupur Connect named client with its verified identity",
  { timeout: 30000 },
  async () => {
    const runtime = new SiteRuntimeService({ dataRoot: testDirectory });
    try {
      const result = await runtime.start({
        ...site,
        uuid: "tirupur-test",
        slug: "tirupurconnect",
        themeKey: "portfolio-tirupurconnect",
        port: await unusedPort()
      });
      assert.equal(result.state, "running");
      const response = await fetch(`${result.url}/__codexsun_sites_identity`);
      assert.equal((await response.json()).client, "tirupurconnect");
      assert.match(await (await fetch(result.url!)).text(), /Tirupur Connect/);
    } finally {
      runtime.close();
    }
  }
);
