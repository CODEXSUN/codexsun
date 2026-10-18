import assert from "node:assert/strict";
import test from "node:test";
import { approvedFrappeAutomaticExports } from "./frappe-live-sync.policy.js";

test("automatic Frappe sync only exports approved enquiries", () => {
  assert.deepEqual(
    approvedFrappeAutomaticExports(["contacts", "enquiries", "activities", "call-logs"]),
    ["enquiries"]
  );
});

test("automatic Frappe sync does not export unapproved modules", () => {
  assert.deepEqual(approvedFrappeAutomaticExports(["contacts", "activities", "call-logs"]), []);
});
