import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDate } from "@codexsun/ui/workspace/utils";

test("task and enquiry due dates display as zero-padded DD-MM-YYYY", () => {
  assert.equal(formatDate("2026-10-20"), "20-10-2026");
  assert.equal(formatDate("2026-01-05"), "05-01-2026");
});

test("database Date values use the same DD-MM-YYYY display", () => {
  assert.equal(formatDate(new Date(2026, 9, 20)), "20-10-2026");
});
