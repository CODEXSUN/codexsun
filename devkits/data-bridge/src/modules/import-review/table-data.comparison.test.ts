import assert from "node:assert/strict";
import test from "node:test";
import { compareVisibleRows } from "./table-data.comparison.js";

test("visible comparison ignores hidden fields and row position", () => {
  const source = [
    { id: 1, name: "Blue" },
    { id: 2, name: "Red" }
  ];
  const target = [
    { id: 3, name: "Red" },
    { id: 4, name: "Green" },
    { id: 5, name: "Blue" }
  ];
  assert.deepEqual(compareVisibleRows(source, target, ["name"]), ["Match", "Match"]);
  assert.deepEqual(compareVisibleRows(target, source, ["name"]), ["Match", "No match", "Match"]);
  assert.deepEqual(compareVisibleRows(source, target, ["id", "name"]), ["No match", "No match"]);
});

test("redacted or absent fields cannot produce a match", () => {
  const rows = [{ token: "[redacted]" }, {}];
  assert.deepEqual(compareVisibleRows(rows, rows, ["token"]), ["Not compared", "Not compared"]);
  assert.deepEqual(compareVisibleRows(rows, rows, []), ["Not compared", "Not compared"]);
});

test("comparison preserves value types and normalizes object key order", () => {
  assert.deepEqual(compareVisibleRows([{ value: 1 }], [{ value: "1" }], ["value"]), ["No match"]);
  assert.deepEqual(
    compareVisibleRows([{ value: { a: 1, b: 2 } }], [{ value: { b: 2, a: 1 } }], ["value"]),
    ["Match"]
  );
});
