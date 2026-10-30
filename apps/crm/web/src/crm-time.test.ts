import assert from "node:assert/strict";
import test from "node:test";
import { formatCrmDateTime, formatCrmWorkTimestamps } from "./crm-time.js";

test("formats CRM work timestamps with local date, seconds, and 12-hour time", () => {
  const timestamp = "2026-10-24T08:50:35.000Z";
  const expected = formatCrmDateTime(new Date(timestamp));

  assert.match(expected, /^\d{2}-\d{2}-2026 \d{2}:\d{2}:\d{2} (?:am|pm)$/u);
  assert.equal(formatCrmWorkTimestamps(`Started @ ${timestamp}`), `Started @ ${expected}`);
});

test("formats both job cycle timestamps in comments", () => {
  const result = formatCrmWorkTimestamps(
    "Job completed\nStarted @ 2026-10-24T08:49:17.000Z\nCompleted @ 2026-10-24T08:50:35.000Z"
  );

  assert.doesNotMatch(result, /2026-10-24T/u);
  assert.match(result, /Started @ \d{2}-\d{2}-2026 \d{2}:\d{2}:\d{2} (?:am|pm)/u);
  assert.match(result, /Completed @ \d{2}-\d{2}-2026 \d{2}:\d{2}:\d{2} (?:am|pm)/u);
});

test("converts legacy UTC job and checkpoint comments but keeps pinned local time", () => {
  const expectedStart = formatCrmDateTime(new Date("2026-10-24T08:49:17.000Z"));
  const expectedStop = formatCrmDateTime(new Date("2026-10-24T08:50:35.000Z"));
  const job = formatCrmWorkTimestamps(
    "Job #4 completed\nStarted @ 24-10-26 08:49:17 AM\nCompleted @ 24-10-26 08:50:35 AM"
  );
  assert.equal(job, `Job #4 completed\nStarted @ ${expectedStart}\nCompleted @ ${expectedStop}`);

  const checkpoint = formatCrmWorkTimestamps(
    "Check in\nCaptured @ 24-10-26 08:49:17 AM\nCheck out\nCaptured @ 24-10-26 08:50:35 AM"
  );
  assert.equal(
    checkpoint,
    `Check in\nCaptured @ ${expectedStart}\nCheck out\nCaptured @ ${expectedStop}`
  );

  assert.equal(
    formatCrmWorkTimestamps("Pinned location\nCaptured @ 24-10-26 02:19:33 pm"),
    "Pinned location\nCaptured @ 24-10-2026 02:19:33 pm"
  );
});
