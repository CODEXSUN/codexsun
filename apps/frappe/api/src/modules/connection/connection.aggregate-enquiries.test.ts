import assert from "node:assert/strict";
import { after, test } from "node:test";
import { aggregateFrappeEnquiries } from "./connection.aggregate-enquiries.js";

const originalFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = originalFetch;
});

test("live report groups counts with the same employee visibility filter as enquiry lists", async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/api/resource/Enquiry");
    assert.deepEqual(JSON.parse(url.searchParams.get("fields") ?? "[]"), [
      "group",
      "status",
      { COUNT: "name", as: "count" }
    ]);
    assert.equal(url.searchParams.get("group_by"), "group, status");
    assert.deepEqual(JSON.parse(url.searchParams.get("filters") ?? "[]"), [
      ["date", ">=", "2026-10-01"]
    ]);
    assert.deepEqual(JSON.parse(url.searchParams.get("or_filters") ?? "[]"), [
      ["assigned_to_employee", "=", "EMP-1"],
      ["user_employee", "=", "EMP-1"]
    ]);
    return Response.json({ data: [{ group: "Service", status: "New", count: "4" }] });
  };
  const rows = await aggregateFrappeEnquiries(
    { baseUrl: "https://frappe.example", apiKey: "key", apiSecret: "secret", enabled: true },
    ["group", "status"],
    [["date", ">=", "2026-10-01"]],
    "EMP-1",
    false
  );
  assert.equal(rows[0]?.count, 4);
});

test("restricted live reports require an employee mapping before calling Frappe", async () => {
  globalThis.fetch = async () => {
    throw new Error("unexpected request");
  };
  await assert.rejects(
    () =>
      aggregateFrappeEnquiries(
        { baseUrl: "https://frappe.example", apiKey: "key", apiSecret: "secret", enabled: true },
        ["status"],
        [],
        null,
        false
      ),
    /Map this CRM user/
  );
});
