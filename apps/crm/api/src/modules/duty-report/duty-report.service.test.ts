import assert from "node:assert/strict";
import { test } from "node:test";
import { DutyReportService, recurrenceKey } from "./duty-report.service.js";
import type { DutyReportRepository } from "./duty-report.repository.js";

test("duty recurrence keys follow the selected frequency", () => {
  const date = new Date("2026-10-14T00:00:00.000Z");
  assert.equal(recurrenceKey(date, "daily"), "2026-10-14");
  assert.equal(recurrenceKey(date, "weekly"), "2026-W42");
  assert.equal(recurrenceKey(date, "monthly"), "2026-10");
  assert.equal(recurrenceKey(date, "quarterly"), "2026-Q4");
  assert.equal(recurrenceKey(date, "annually"), "2026");
  assert.equal(recurrenceKey(date, "once"), "once");
});

test("weekly recurrence groups dates by ISO week across year boundaries", () => {
  assert.equal(recurrenceKey(new Date("2021-01-01T00:00:00Z"), "weekly"), "2020-W53");
  assert.equal(recurrenceKey(new Date("2021-01-04T00:00:00Z"), "weekly"), "2021-W01");
});

test("blocked duty reports require issue details and preserve the blocked result", async () => {
  const writes: unknown[][] = [];
  const repository = {
    create: async (...args: unknown[]) => {
      writes.push(args);
      return { id: 1 };
    },
  } as unknown as DutyReportRepository;
  const service = new DutyReportService(repository);
  const base = {
    assignmentId: 7,
    performedDate: "2026-10-14",
    actions: "Checked the machine.",
    result: "blocked" as const,
    issueDetails: "Replacement part is unavailable.",
  };

  await assert.rejects(
    service.create({ ...base, issueDetails: "  " }, 3, "worker@example.test", "daily"),
    /blocked reports need issue details/,
  );
  await service.create(base, 3, "worker@example.test", "daily");

  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0]?.[0], base);
});
