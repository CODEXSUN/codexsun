import assert from "node:assert/strict";
import test from "node:test";
import { mapCrmReminderNotification, scheduleSourceHref } from "./platform-notifications.mapper";
import type { ScheduleRecord, ScheduleSourceType } from "@codexsun/crm-web/modules/scheduler";

const sourceTypes: ScheduleSourceType[] = ["enquiry", "task", "call-log", "duty", "sop"];

test("CRM reminder notifications keep the schedule identity and linked-source context", () => {
  const notification = mapCrmReminderNotification({
    id: 41,
    uuid: "ab12cd34",
    notes: "Call customer",
    sourceType: "enquiry",
    sourceId: 12,
    sourceLabel: "#12 · Repair request",
    scheduledAt: "2026-10-20T11:00:00.000Z",
    acknowledgedAt: null,
    status: "scheduled",
    assignedUserId: 4,
    assignedTo: "Vijay",
    createdBy: "vijay@example.test",
    createdAt: "2026-10-20T10:00:00.000Z"
  } satisfies ScheduleRecord);

  assert.equal(notification.id, "crm-schedule:41");
  assert.equal(notification.title, "Call customer");
  assert.match(notification.body, /Enquiry · #12 · Repair request/u);
  assert.equal(typeof notification.onSelect, "function");
});

test("reminder links target the owning CRM page for every supported source", () => {
  const expected = {
    enquiry: "/app/crm/enquiries/8",
    task: "/app/crm/tasks/8",
    "call-log": "/app/crm/call-logs",
    duty: "/app/crm/duties",
    sop: "/app/crm/sops"
  } satisfies Record<ScheduleSourceType, string>;

  for (const sourceType of sourceTypes)
    assert.equal(scheduleSourceHref(sourceType, 8), expected[sourceType]);
});
