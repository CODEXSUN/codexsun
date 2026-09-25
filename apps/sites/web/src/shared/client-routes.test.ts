import assert from "node:assert/strict";
import test from "node:test";
import { clientSlugs, publicRoutePaths, standaloneRoutePaths } from "./client-routes";

test("public route manifest covers every client and has no duplicates", () => {
  const routes = publicRoutePaths();
  assert.equal(new Set(routes).size, routes.length);
  for (const slug of clientSlugs) {
    assert.ok(routes.includes(`/clients/${slug}`));
    assert.ok(routes.includes(`/clients/${slug}/about`));
    assert.ok(routes.includes(`/clients/${slug}/services`));
    assert.ok(routes.includes(`/clients/${slug}/work`));
    assert.ok(routes.includes(`/clients/${slug}/contact`));
  }
  assert.ok(routes.includes("/clients/skilloopz/learning-path"));
  assert.ok(routes.includes("/clients/skilloopz/placement-path"));
});

test("standalone route manifest is host-relative", () => {
  assert.deepEqual(standaloneRoutePaths(), ["/", "/about", "/services", "/work", "/contact", "/privacy", "/terms", "/cookies"]);
});
