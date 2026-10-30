import assert from "node:assert/strict";
import test from "node:test";
import { deterministicCatalogMatch } from "./catalog-matching.domain.js";
const candidate = {
  productInformationId: 1,
  variantId: 2,
  sku: "SKU-1",
  barcode: "8901",
  slug: "blue-shirt",
  title: "Blue Shirt",
  brand: "CX"
};
test("uses deterministic rules in priority order", () => {
  assert.equal(
    deterministicCatalogMatch(
      {
        sourceReference: "a",
        sku: "sku-1",
        barcode: "8901",
        slug: "blue-shirt",
        title: "Blue Shirt",
        brand: "CX"
      },
      [candidate]
    ).strategy,
    "sku"
  );
  assert.equal(
    deterministicCatalogMatch(
      {
        sourceReference: "b",
        barcode: "8901",
        slug: "blue-shirt",
        title: "Blue Shirt",
        brand: "CX"
      },
      [candidate]
    ).strategy,
    "barcode"
  );
});
test("returns none before any semantic adapter can run", () => {
  assert.deepEqual(
    deterministicCatalogMatch({ sourceReference: "c", title: "Unknown", brand: "Other" }, [
      candidate
    ]),
    { candidate: null, confidence: 0, strategy: "none" }
  );
});

test("uses slug and exact title plus brand only after stronger identifiers", () => {
  assert.equal(
    deterministicCatalogMatch(
      { sourceReference: "d", slug: "blue-shirt", title: "Different", brand: "Other" },
      [candidate]
    ).strategy,
    "slug"
  );
  assert.equal(
    deterministicCatalogMatch({ sourceReference: "e", title: " BLUE--SHIRT ", brand: "cx" }, [
      candidate
    ]).strategy,
    "title-brand"
  );
  assert.equal(
    deterministicCatalogMatch({ sourceReference: "f", title: "Blue Shirt" }, [candidate]).strategy,
    "none"
  );
});
