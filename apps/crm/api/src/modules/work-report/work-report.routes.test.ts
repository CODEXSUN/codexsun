import assert from "node:assert/strict";
import test from "node:test";
import { workReportInput } from "./work-report.routes.js";
import { checkpointCycleCommentBody } from "./work-report.repository.js";

const base = {
  enquiryId: 12,
  taskId: null,
  body: "",
  requestId: "test-request-001",
  latitude: null,
  longitude: null,
  accuracyMeters: null,
  capturedAt: null
};

const gps = {
  latitude: 13.08,
  longitude: 80.27,
  accuracyMeters: 12,
  capturedAt: "2026-10-19T08:00:00.000Z"
};
const checkpoint = (action: "check-in" | "check-out", values = {}) =>
  workReportInput.safeParse({ ...base, action, ...gps, ...values });
const valid = (values: Record<string, unknown>) =>
  workReportInput.safeParse({ ...base, ...values }).success;

const cases: Array<[string, boolean, Record<string, unknown>]> = [
  ["accepts a text report", true, { action: "report", body: "Customer visit completed" }],
  ["rejects a blank report", false, { action: "report", body: "  " }],
  ["rejects a report with a charge amount", false, { action: "report", body: "Visit", amount: 5 }],
  ["accepts a positive charge", true, { action: "charge", amount: 1250 }],
  ["accepts a decimal charge", true, { action: "charge", amount: 12.5 }],
  ["rejects a zero charge", false, { action: "charge", amount: 0 }],
  ["rejects a negative charge", false, { action: "charge", amount: -1 }],
  ["rejects a charge without amount", false, { action: "charge", amount: null }],
  ["rejects GPS data on a charge", false, { action: "charge", amount: 250, ...gps }],
  [
    "accepts a positive collection with notes",
    true,
    { action: "collection", amount: 500, body: "Cash received" }
  ],
  ["rejects a collection without notes", false, { action: "collection", amount: 500 }],
  ["rejects a collection without amount", false, { action: "collection", amount: null }],
  ["accepts a check-in with captured GPS", true, { action: "check-in", ...gps }],
  ["accepts a check-out with captured GPS", true, { action: "check-out", ...gps }],
  ["rejects a checkpoint without latitude", false, { action: "check-in", ...gps, latitude: null }],
  [
    "rejects a checkpoint without longitude",
    false,
    { action: "check-out", ...gps, longitude: null }
  ],
  [
    "rejects latitude outside geographic bounds",
    false,
    { action: "check-in", ...gps, latitude: 91 }
  ],
  [
    "rejects longitude outside geographic bounds",
    false,
    { action: "check-in", ...gps, longitude: 181 }
  ],
  [
    "rejects a checkpoint without capture time",
    false,
    { action: "check-in", ...gps, capturedAt: null }
  ],
  [
    "rejects an invalid capture timestamp",
    false,
    { action: "check-out", ...gps, capturedAt: "yesterday" }
  ],
  ["rejects a checkpoint with an amount", false, { action: "check-in", ...gps, amount: 5 }],
  ["rejects an unknown action", false, { action: "mark-complete" }],
  ["rejects a missing target", false, { action: "report", body: "Visit", enquiryId: null }],
  ["rejects both enquiry and task targets", false, { action: "report", body: "Visit", taskId: 2 }],
  ["rejects an invalid retry key", false, { action: "report", body: "Visit", requestId: "short" }],
  ["rejects extra client fields", false, { action: "report", body: "Visit", unexpected: true }]
];

for (const [name, expected, values] of cases) {
  test(name, () => assert.equal(valid(values), expected));
}

test("checkpoint retry identity is preserved for both directions", () => {
  assert.equal(checkpoint("check-in").success, true);
  assert.equal(checkpoint("check-out", { requestId: "checkout-request-02" }).success, true);
});

test("completed checkpoint comments include both notes and captured locations", () => {
  const body = checkpointCycleCommentBody(
    {
      body: "Arrived at the site.",
      latitude: 13.08,
      longitude: 80.27,
      accuracy_meters: 8,
      captured_at: "2026-10-22T08:05:09.000Z"
    },
    {
      body: "Work finished.",
      latitude: 13.09,
      longitude: 80.28,
      accuracy_meters: 10,
      captured_at: "2026-10-22T13:05:09.000Z"
    }
  );
  assert.match(body, /Check in\nArrived at the site\./);
  assert.match(body, /13\.08, 80\.27 · 8 m/);
  assert.match(body, /Check out\nWork finished\./);
  assert.match(body, /13\.09, 80\.28 · 10 m/);
  assert.match(body, /Captured @ 2026-10-22T08:05:09\.000Z/);
  assert.match(body, /Captured @ 2026-10-22T13:05:09\.000Z/);
});
