import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate, formatDateTime } from "../packages/ui/src/workspace/utils";

test("formats ISO calendar dates without a timezone shift", () => {
  assert.equal(formatDate("2026-02-03"), "03-02-2026");
  assert.equal(formatDate("2024-02-29"), "29-02-2024");
  assert.equal(formatDate("2026-02-30"), "2026-02-30");
});

test("formats timestamps with the same date order and a 24-hour time", () => {
  const date = new Date(2026, 1, 3, 14, 5);
  assert.equal(formatDate(date), "03-02-2026");
  assert.equal(formatDateTime(date), "03-02-2026 14:05");
});
