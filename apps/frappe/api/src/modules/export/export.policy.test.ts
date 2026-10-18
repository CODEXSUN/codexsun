import assert from "node:assert/strict";
import test from "node:test";
import { assertFrappeExportAllowed } from "./export.policy.js";

test("only enquiry records may be exported to Frappe", () => {
  assert.doesNotThrow(() => assertFrappeExportAllowed("enquiries", "export"));
  for (const kind of ["contacts", "activities", "call-logs"] as const) {
    assert.throws(() => assertFrappeExportAllowed(kind, "export"), /not approved/u);
  }
});

test("verification remains available for every export kind", () => {
  for (const kind of ["contacts", "enquiries", "activities", "call-logs"] as const) {
    assert.doesNotThrow(() => assertFrappeExportAllowed(kind, "verify"));
  }
});
