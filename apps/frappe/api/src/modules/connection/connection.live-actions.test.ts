import assert from "node:assert/strict";
import { after, test } from "node:test";
import { LiveFrappeActions } from "./connection.live-actions.js";

const originalFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = originalFetch;
});
const settings = {
  baseUrl: "https://frappe.example/",
  apiKey: "key",
  apiSecret: "secret",
  enabled: true
};
const input = {
  title: "Motor",
  details: "Replace motor",
  customer: null,
  mobile: "9876543210",
  date: "2026-10-11",
  dueDate: null,
  group: "Cutting",
  assigneeCode: "EMP-2",
  priority: "Normal",
  status: "New",
  statusDetails: null
};

test("legacy live enquiry creation cannot send a remote write", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("No request expected");
  };
  await assert.rejects(
    new LiveFrappeActions(settings, "EMP-1", false).create(input),
    /Sending records to Frappe is disabled/
  );
  assert.equal(calls, 0);
});

test("live update refuses a record outside the mapped employee before writing", async () => {
  let writes = 0;
  globalThis.fetch = async (_url, init) => {
    if (init?.method === "PUT") writes += 1;
    return Response.json({
      data: { name: "ENQ-1", user_employee: "EMP-2", assigned_to_employee: "EMP-3" }
    });
  };
  await assert.rejects(
    () => new LiveFrappeActions(settings, "EMP-1", false).update("ENQ-1", { status: "Open" }),
    /cannot change/
  );
  assert.equal(writes, 0);
});

test("an unmapped user cannot edit an unassigned live enquiry", async () => {
  let writes = 0;
  globalThis.fetch = async (_url, init) => {
    if (init?.method === "PUT") writes += 1;
    return Response.json({
      data: { name: "ENQ-1", user_employee: null, assigned_to_employee: null }
    });
  };
  await assert.rejects(
    () => new LiveFrappeActions(settings, null, false).update("ENQ-1", { status: "Open" }),
    /cannot change/
  );
  assert.equal(writes, 0);
});

const legacyWriteCases = [
  {
    name: "reply",
    run: (actions: LiveFrappeActions) => actions.addMessage("ENQ-1", "Reply", "MSG-1")
  },
  { name: "open call", run: (actions: LiveFrappeActions) => actions.openNewCall("ENQ-1") },
  {
    name: "manual work job",
    run: (actions: LiveFrappeActions) =>
      actions.saveJob("ENQ-1", {
        employee: "EMP-1",
        startTime: "23:30:00",
        stopTime: "00:30:00",
        ratePerHour: 120,
        status: "Completed"
      })
  },
  { name: "start work job", run: (actions: LiveFrappeActions) => actions.startJob("ENQ-1") }
];
for (const scenario of legacyWriteCases)
  test(`legacy ${scenario.name} cannot send a remote CRM write`, async () => {
    let writes = 0;
    globalThis.fetch = async (url, init) => {
      const path = new URL(String(url)).pathname;
      if (init?.method !== "GET" && path !== "/api/v2/method/frappe.client.get_list") writes++;
      if (path === "/api/v2/method/frappe.client.get_list") return Response.json({ message: [] });
      if (path === "/api/resource/Employee/EMP-1")
        return Response.json({ data: { cost_per_hour: "150" } });
      if (path === "/api/resource/Enquiry/ENQ-1")
        return Response.json({
          data: {
            name: "ENQ-1",
            user_employee: "EMP-1",
            status: "New",
            enquiry_messages: [{ name: "MSG-1", comment: "First", mode: "Comment" }]
          }
        });
      return Response.json({ data: [{ name: "Open", status_name: "Open" }] });
    };
    await assert.rejects(
      scenario.run(new LiveFrappeActions(settings, "EMP-1", false)),
      /Sending records to Frappe is disabled/
    );
    assert.equal(writes, 0);
  });
