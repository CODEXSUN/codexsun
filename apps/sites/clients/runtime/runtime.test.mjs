import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:net";
import { get as httpGet } from "node:http";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { publicationChecksum } from "@codexsun/sites-api/delivery-integrity";
const root = resolve(import.meta.dirname, "../../../..");
async function port() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
test(
  "packaged public servers render SEO, serve assets, save isolated enquiries and recover SQLite after restart",
  { skip: process.env.CODEXSUN_SITES_RELEASE_TEST !== "1", timeout: 60000 },
  async () => {
    const directory = mkdtempSync(resolve(tmpdir(), "codexsun-sites-http-"));
    const servers = [];
    try {
      for (const slug of ["logicx", "ramutex"]) {
        const releaseDirectory = resolve(root, "dist/apps/sites/releases", slug);
        const module = await import(pathToFileURL(resolve(releaseDirectory, "runtime/server.mjs")));
        const origin = `http://127.0.0.1:${await port()}`;
        const runtime = module.createSiteServer({
          releaseDirectory,
          databasePath: resolve(directory, slug + ".sqlite"),
          origin
        });
        await new Promise((resolve) =>
          runtime.server.listen(Number(new URL(origin).port), "127.0.0.1", resolve)
        );
        servers.push({ ...runtime, origin, releaseDirectory, module });
      }
      const input = {
        name: "Test sender",
        email: "sender@example.test",
        company: "Test company",
        phone: "",
        message: "Please discuss our requirements.",
        consent: true,
        website: ""
      };
      for (const runtime of servers) {
        for (const path of ["/", "/about", "/services", "/contact", "/blogs", "/privacy"]) {
          const response = await fetch(runtime.origin + path);
          assert.equal(response.status, 200, path);
          const html = await response.text();
          assert.ok(html.includes('rel="canonical"'));
          assert.ok(html.includes('id="codexsun-sites-publication"'));
          assert.ok(html.includes("<h1"));
          assert.ok(
            !html.includes("Design options"),
            "Development controls must not ship in production HTML"
          );
          assert.ok(!html.includes("127.0.0.1:7010"));
          assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        }
        for (const asset of [
          "/logo.svg",
          "/logo-dark.svg",
          "/favicon.svg",
          "/favicon.ico",
          "/apple-touch-icon.png",
          "/social-card.png",
          "/site.webmanifest"
        ]) {
          assert.equal((await fetch(runtime.origin + asset)).status, 200, asset);
        }
        assert.ok(
          (await (await fetch(runtime.origin + "/sitemap.xml")).text()).includes(
            runtime.origin + "/privacy"
          )
        );
        assert.ok(
          (await (await fetch(runtime.origin + "/robots.txt")).text()).includes(
            "Sitemap: " + runtime.origin
          )
        );
        assert.equal(
          (await fetch(runtime.origin + "/site.xml", { redirect: "manual" })).status,
          308
        );
        assert.equal((await fetch(runtime.origin + "/content.sqlite")).status, 404);
        assert.equal((await fetch(runtime.origin + "/publication.json")).status, 404);
        assert.equal(
          await new Promise((resolve) =>
            httpGet(
              runtime.origin + "/health",
              { headers: { host: "other-client.example" } },
              (response) => {
                response.resume();
                resolve(response.statusCode);
              }
            )
          ),
          421
        );
      }
      const first = servers[0],
        second = servers[1];
      const key = randomUUID();
      const send = (runtime, body, requestKey = key, origin = runtime.origin) =>
        fetch(runtime.origin + "/content/v1/enquiries", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: origin,
            "Idempotency-Key": requestKey
          },
          body: JSON.stringify(body)
        });
      const accepted = await send(first, input);
      assert.equal(accepted.status, 201);
      const saved = await accepted.json();
      assert.deepEqual(await (await send(first, input)).json(), saved);
      assert.equal(first.enquiries.list().length, 1);
      assert.equal(second.enquiries.list().length, 0);
      assert.equal((await send(first, { ...input, email: "invalid" }, randomUUID())).status, 422);
      assert.equal((await send(first, { ...input, consent: false }, randomUUID())).status, 422);
      assert.equal((await send(first, { ...input, message: "Changed requirement." })).status, 409);
      assert.equal((await send(first, input, randomUUID(), second.origin)).status, 403);
      assert.equal((await send(second, input)).status, 201);
      assert.equal(second.enquiries.list().length, 1);
      const original = first.store.snapshot();
      const { sequence, publishedAt: _publishedAt, checksum: _checksum, ...payload } = original;
      payload.content.hero.title = "Updated published headline";
      payload.blogs = [
        {
          title: "A published note",
          slug: "published-note",
          summary: "A public note.",
          body: "Public text."
        }
      ];
      const updated = {
        ...payload,
        sequence: sequence + 1,
        publishedAt: new Date().toISOString(),
        checksum: publicationChecksum(payload)
      };
      first.store.apply(updated);
      assert.ok(
        (await (await fetch(first.origin + "/")).text()).includes("Updated published headline")
      );
      assert.equal((await fetch(first.origin + "/blogs/published-note")).status, 200);
      payload.blogs = [];
      first.store.apply({
        ...payload,
        sequence: sequence + 2,
        publishedAt: new Date().toISOString(),
        checksum: publicationChecksum(payload)
      });
      assert.equal((await fetch(first.origin + "/blogs/published-note")).status, 404);
      assert.ok(
        !(await (await fetch(first.origin + "/sitemap.xml")).text()).includes("published-note")
      );
      await first.close();
      first.closed = true;
      const reopened = first.module.createSiteServer({
        releaseDirectory: first.releaseDirectory,
        databasePath: resolve(directory, "logicx.sqlite"),
        origin: first.origin
      });
      assert.equal(reopened.enquiries.list().length, 1);
      assert.equal(reopened.store.snapshot().sequence, sequence + 2);
      await reopened.close();
    } finally {
      for (const runtime of servers) if (!runtime.closed) await runtime.close();
      rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  }
);
