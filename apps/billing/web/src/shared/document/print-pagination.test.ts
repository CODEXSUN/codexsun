import assert from "node:assert/strict";
import test from "node:test";
import { getBillingPrintDummyLineCount, paginateBillingPrintItems } from "./print-pagination";

test("compact invoice pages reserve QR space without dropping or reordering lines", () => {
  for (const count of [0, 1, 6, 7, 12, 13, 25]) {
    const items = Array.from({ length: count }, (_, index) => index);
    const pages = paginateBillingPrintItems(items, 6);
    assert.deepEqual(
      pages.flat().map(({ item }) => item),
      items
    );
    assert.deepEqual(
      pages.flat().map(({ index }) => index),
      items
    );
    assert.ok(pages.every((page) => page.length <= 6));
  }
  assert.equal(getBillingPrintDummyLineCount([{ primary: "Item", variant: "" }], 6), 15);
  assert.throws(() => paginateBillingPrintItems([], 0), /Invalid print page size/);
});
