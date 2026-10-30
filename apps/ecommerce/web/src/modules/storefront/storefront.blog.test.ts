import assert from "node:assert/strict";
import test from "node:test";
import { invalidateStorefrontClientCache, listLatestBlogPosts } from "./storefront.services";

test("disabled Blog does not request stories and enabled Blog retains stories", async () => {
  const previousFetch = globalThis.fetch;
  const previousWindow = globalThis.window;
  Object.assign(globalThis, { window: { setTimeout, clearTimeout } });
  let enabled = false;
  const paths: string[] = [];
  globalThis.fetch = async (input) => {
    const path = String(input);
    paths.push(path);
    return Response.json({
      success: true,
      data: path.endsWith("/public/app-portal") ? { blogEnabled: enabled } : [{ slug: "story" }]
    });
  };
  try {
    invalidateStorefrontClientCache();
    assert.deepEqual(await listLatestBlogPosts(), []);
    assert.equal(
      paths.some((path) => path.includes("/public/blog?")),
      false
    );
    enabled = true;
    invalidateStorefrontClientCache();
    assert.deepEqual(await listLatestBlogPosts(), [{ slug: "story" }]);
    assert.equal(paths.filter((path) => path.includes("/public/blog?")).length, 1);
  } finally {
    globalThis.fetch = previousFetch;
    Object.assign(globalThis, { window: previousWindow });
    invalidateStorefrontClientCache();
  }
});
