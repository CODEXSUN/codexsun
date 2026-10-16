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

test("live create uses the mapped employee and Frappe Enquiry document", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(new URL(String(url)).pathname, "/api/resource/Enquiry");
    assert.ok(init);
    assert.equal(init.method, "POST");
    assert.equal((init.headers as Record<string, string>).Authorization, "token key:secret");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.user_employee, "EMP-1");
    assert.equal(body.assigned_to_employee, "EMP-2");
    assert.equal(body.enquiry_details, "Replace motor");
    assert.deepEqual(body.enquiry_messages, [{ comment: "Replace motor", mode: "Comment" }]);
    return Response.json({ data: { name: "ENQ-1" } });
  };
  assert.equal(await new LiveFrappeActions(settings, "EMP-1", false).create(input), "ENQ-1");
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

test("live reply preserves existing child messages and targets its parent", async () => {
  let written: Record<string, unknown> | null = null;
  globalThis.fetch = async (_url, init) => {
    if (init?.method === "GET")
      return Response.json({
        data: {
          name: "ENQ-1",
          user_employee: "EMP-1",
          enquiry_messages: [{ name: "MSG-1", comment: "First", mode: "Comment" }]
        }
      });
    written = JSON.parse(String(init?.body));
    return Response.json({ data: { name: "ENQ-1" } });
  };
  await new LiveFrappeActions(settings, "EMP-1", false).addMessage("ENQ-1", "Reply", "MSG-1");
  const messages = (written as { enquiry_messages: Array<Record<string, string>> } | null)
    ?.enquiry_messages;
  assert.equal(messages?.length, 2);
  assert.deepEqual(messages?.[0], { name: "MSG-1", comment: "First", mode: "Comment" });
  assert.deepEqual(messages?.[1], { comment: "Reply", mode: "Reply", parent_message: "MSG-1" });
});

test("live open call writes Open and the automatic message together", async () => {
  const writes: Array<Record<string, unknown>> = [];
  globalThis.fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path === "/api/resource/Enquiry/ENQ-1" && init?.method === "GET")
      return Response.json({
        data: { name: "ENQ-1", user_employee: "EMP-1", status: "New", enquiry_messages: [] }
      });
    if (path === "/api/resource/Enquiry/ENQ-1" && init?.method === "PUT") {
      writes.push(JSON.parse(String(init.body)));
      return Response.json({ data: { name: "ENQ-1" } });
    }
    return Response.json({ data: [{ name: "Open", status_name: "Open" }] });
  };
  await new LiveFrappeActions(settings, "EMP-1", false).openNewCall("ENQ-1");
  assert.equal(writes[0]?.status, "Open");
  assert.deepEqual(writes[0]?.enquiry_messages, [{ comment: "New call opened", mode: "Comment" }]);
});

test("manual job across midnight calculates one hour and its cost", async () => {
  const writes: Array<Record<string, unknown>> = [];
  globalThis.fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path === "/api/resource/Enquiry/ENQ-1")
      return Response.json({ data: { name: "ENQ-1", user_employee: "EMP-1" } });
    if (path === "/api/v2/method/frappe.client.get_list") return Response.json({ message: [] });
    writes.push(JSON.parse(String(init?.body)));
    return Response.json({ data: { name: "JOB-1", ...writes[0] } });
  };
  const job = await new LiveFrappeActions(settings, "EMP-1", false).saveJob("ENQ-1", {
    employee: "EMP-1",
    startTime: "23:30:00",
    stopTime: "00:30:00",
    ratePerHour: 120,
    status: "Completed"
  });
  assert.equal(writes[0]?.hours, 1);
  assert.equal(writes[0]?.total_cost, 120);
  assert.equal(job.totalCost, 120);
});

test("starting a job shows the mapped employee's Frappe cost rate", async () => {
  globalThis.fetch = async (url) => {
    const path = new URL(String(url)).pathname;
    if (path === "/api/resource/Enquiry/ENQ-1")
      return Response.json({ data: { name: "ENQ-1", user_employee: "EMP-1" } });
    if (path === "/api/v2/method/frappe.client.get_list") return Response.json({ message: [] });
    if (path === "/api/resource/Employee/EMP-1")
      return Response.json({ data: { cost_per_hour: "150" } });
    return Response.json({ data: { name: "JOB-1", status: "Running" } });
  };
  const job = await new LiveFrappeActions(settings, "EMP-1", false).startJob("ENQ-1");
  assert.equal(job.ratePerHour, 150);
});
