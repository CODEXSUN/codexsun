import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, test } from "node:test";
import {
  crmDutyFrequency,
  frappeDutyFrequency,
  resolveDutyDepartment,
  dutyReportActions,
  dutyReportDate,
  dutyItemName
} from "./crm-duty-sync.mapping.js";

const contract = JSON.parse(
  readFileSync(new URL("./fixtures/logicx-duty-contract.json", import.meta.url), "utf8")
);
const settings = {
  baseUrl: "https://frappe.test",
  apiKey: "key",
  apiSecret: "secret",
  enabled: true
};
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("all supported frequencies match the actual LogicX select options in both directions", () => {
  const options = contract.doctypes["SOP Item"].fields
    .find((field: { fieldname: string }) => field.fieldname === "frequency")
    .options.split("\n");
  assert.deepEqual(["daily", "weekly", "monthly", "annually"].map(frappeDutyFrequency), options);
  for (const remote of options) assert.equal(frappeDutyFrequency(crmDutyFrequency(remote)), remote);
});

test("unsupported recurrences fail without substituting another reporting period", () => {
  for (const frequency of ["quarterly", "once", "Daily", "", "toString"])
    assert.throws(() => frappeDutyFrequency(frequency), /does not support/);
  assert.throws(() => crmDutyFrequency("Quarterly"), /unsupported/);
});

test("Department document identity takes precedence over its display label", async () => {
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(init?.method, "GET");
    assert.deepEqual(JSON.parse(url.searchParams.get("filters")!), [
      ["name", "=", "Stores - LX"],
      ["disabled", "=", 0]
    ]);
    return Response.json({ data: [{ name: "Stores - LX" }] });
  };
  assert.equal(await resolveDutyDepartment(" Stores - LX ", settings), "Stores - LX");
});

test("a unique active Department label binds to the remote document name", async () => {
  let calls = 0;
  globalThis.fetch = async (input) => {
    const filters = JSON.parse(new URL(String(input)).searchParams.get("filters")!);
    calls++;
    return Response.json({ data: filters[0][0] === "name" ? [] : [{ name: "Stores - LX" }] });
  };
  assert.equal(await resolveDutyDepartment("Stores", settings), "Stores - LX");
  assert.equal(calls, 2);
});

test("Department mapping rejects missing, ambiguous, malformed, and unavailable upstream results", async () => {
  await assert.rejects(resolveDutyDepartment(" ", settings), /Choose a Department/);
  for (const rows of [[], [{ name: "Stores - A" }, { name: "Stores - B" }]]) {
    globalThis.fetch = async () => Response.json({ data: rows });
    await assert.rejects(resolveDutyDepartment("Stores", settings), /must match one active/);
  }
  for (const data of [null, {}, [null], [{ name: 123 }]]) {
    globalThis.fetch = async () => Response.json({ data });
    await assert.rejects(resolveDutyDepartment("Stores", settings));
  }
  for (const status of [403, 503]) {
    globalThis.fetch = async () => Response.json({}, { status });
    await assert.rejects(resolveDutyDepartment("Stores", settings));
  }
});

test("blocked reports preserve outcome and issue details without injecting HTML", () => {
  const result = dutyReportActions(
    "Check <script>alert(1)</script>",
    "blocked",
    "No <parts> & tools"
  );
  assert.match(result, /Result: blocked/);
  assert.match(result, /Issue: No &lt;parts&gt; &amp; tools/);
  assert.ok(!result.includes("<script>"));
  assert.equal(
    dutyReportActions("Counter checked.", "completed", ""),
    "<p>Result: completed</p><p>Counter checked.</p>"
  );
});

test("report date binding handles database dates and API strings", () => {
  assert.equal(dutyReportDate(new Date("2026-10-17T00:00:00Z")), "2026-10-17");
  assert.equal(dutyReportDate("2026-10-17"), "2026-10-17");
});

test("flat SOP names are not duplicated and legacy grouped names remain distinct", () => {
  assert.equal(dutyItemName("Office checks", "Office checks"), "Office checks");
  assert.equal(dutyItemName("Office checks", "Lock doors"), "Office checks: Lock doors");
});
