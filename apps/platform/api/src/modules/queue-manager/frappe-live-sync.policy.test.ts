import assert from "node:assert/strict";
import test from "node:test";
import {
  approvedFrappeAutomaticExports,
  frappeInboundModifiedAfter
} from "./frappe-live-sync.policy.js";

test("automatic Frappe sync only exports approved enquiries", () => {
  assert.deepEqual(
    approvedFrappeAutomaticExports(["contacts", "enquiries", "activities", "call-logs"]),
    ["enquiries"]
  );
});

test("inbound-only mode schedules no automatic exports", () => {
  assert.deepEqual(approvedFrappeAutomaticExports(["enquiries", "activities"], "inbound"), []);
});

test("first inbound run imports history and recovery uses the successful checkpoint", () => {
  const baseUrl = "https://frappe.example/";
  assert.equal(
    frappeInboundModifiedAfter({ inboundBaseUrl: null, inboundCheckpointAt: null }, baseUrl),
    undefined
  );
  assert.equal(
    frappeInboundModifiedAfter(
      { inboundBaseUrl: "https://old.example/", inboundCheckpointAt: "2026-10-01T00:00:00Z" },
      baseUrl
    ),
    undefined
  );
  assert.equal(
    frappeInboundModifiedAfter(
      { inboundBaseUrl: baseUrl, inboundCheckpointAt: "2026-10-01T00:00:00Z" },
      baseUrl
    ),
    "2026-09-30T00:00:00.000Z"
  );
});

test("automatic Frappe sync does not export unapproved modules", () => {
  assert.deepEqual(approvedFrappeAutomaticExports(["contacts", "activities", "call-logs"]), []);
});
