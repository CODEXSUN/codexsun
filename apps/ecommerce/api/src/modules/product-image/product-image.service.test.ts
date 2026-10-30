import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProductImageUrl } from "./product-image.service.js";

test("product images accept the local URL returned by upload", () => {
  const path = "/api/platform/storefront/product-images/reference-laptop.webp";
  assert.equal(normalizeProductImageUrl(path), path);
  assert.equal(
    normalizeProductImageUrl("https://example.com/product.png"),
    "https://example.com/product.png"
  );
});

test("product image URLs reject traversal, unrelated paths, and executable protocols", () => {
  for (const path of [
    "/api/platform/storefront/product-images/../private.png",
    "/api/platform/storefront/product-images/%2e%2e/private.png",
    "/unrelated/product.png",
    "javascript:alert(1)"
  ])
    assert.throws(() => normalizeProductImageUrl(path));
});
