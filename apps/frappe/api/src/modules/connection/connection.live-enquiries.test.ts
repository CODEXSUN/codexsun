import assert from "node:assert/strict";
import { after, test } from "node:test";
import type { Kysely } from "kysely";
import { encryptFrappeCredential } from "./connection.secrets.js";
import { getLiveFrappeEnquiry, listLiveFrappeEnquiries } from "./connection.live-enquiries.js";
import { FrappeCrmEnquirySource } from "./connection.data-source.js";
import type { FrappeDatabase } from "./connection.types.js";

const originalFetch = globalThis.fetch;
after(() => {
  globalThis.fetch = originalFetch;
});

function database(provider: "local" | "frappe") {
  const row = {
    base_url: "https://frappe.example/",
    api_key_ciphertext: encryptFrappeCredential("key", "test-secret", "key"),
    api_secret_ciphertext: encryptFrappeCredential("secret", "test-secret", "secret"),
    enabled: true,
    verification_status: "verified"
  };
  return {
    selectFrom: (table: string) => ({
      select: () => ({
        where: () => ({
          executeTakeFirst: async () => (table === "frappe_data_sources" ? { provider } : undefined)
        })
      }),
      selectAll: () => ({ where: () => ({ executeTakeFirst: async () => row }) })
    })
  } as unknown as Kysely<FrappeDatabase>;
}

const defaults = { baseUrl: "", apiKey: "", apiSecret: "", enabled: false };
const query = {
  scope: "assigned" as const,
  page: 2,
  pageSize: 1,
  search: "printer",
  status: "Pending"
};

test("live CRM query sends paged TechMedia enquiry filters to Frappe", async () => {
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/api/resource/Enquiry");
    if (url.searchParams.has("group_by")) {
      assert.equal(url.searchParams.get("group_by"), "status");
      assert.deepEqual(JSON.parse(url.searchParams.get("filters") ?? "[]"), [
        ["assigned_to_employee", "=", "EMP-1"]
      ]);
      assert.equal(JSON.parse(url.searchParams.get("or_filters") ?? "[]").length, 5);
      return Response.json({ data: [{ status: "Pending", count: 12 }] });
    }
    assert.equal(url.searchParams.get("limit_start"), "1");
    assert.equal(url.searchParams.get("limit_page_length"), "2");
    assert.deepEqual(JSON.parse(url.searchParams.get("filters") ?? "[]"), [
      ["assigned_to_employee", "=", "EMP-1"],
      ["status", "=", "Pending"]
    ]);
    assert.equal(JSON.parse(url.searchParams.get("or_filters") ?? "[]").length, 5);
    assert.equal(
      (init?.headers as Record<string, string> | undefined)?.Authorization,
      "token key:secret"
    );
    return Response.json({
      data: [
        { name: "ENQ-2", title: "Printer" },
        { name: "ENQ-3", title: "More" }
      ]
    });
  };
  const result = await listLiveFrappeEnquiries(
    database("frappe"),
    defaults,
    "test-secret",
    query,
    "EMP-1",
    false
  );
  assert.equal(result.hasMore, true);
  assert.equal(result.total, 12);
  assert.deepEqual(result.statusCounts, [{ code: "Pending", count: 12 }]);
  assert.deepEqual(
    result.items.map((item) => item.name),
    ["ENQ-2"]
  );
});

test("live enquiry creator and assignee display employee names with code fallback", async () => {
  let employeeRequests = 0;
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/resource/Employee") {
      employeeRequests += 1;
      assert.deepEqual(JSON.parse(url.searchParams.get("filters") ?? "[]"), [
        ["name", "in", ["HR-EMP-00009", "HR-EMP-00011", "HR-EMP-00013"]]
      ]);
      return Response.json({
        data: [
          { name: "HR-EMP-00009", employee_name: "Vijay Anand" },
          { name: "HR-EMP-00011", employee_name: "Karthik D" }
        ]
      });
    }
    if (url.searchParams.has("group_by"))
      return Response.json({ data: [{ status: "New", count: 2 }] });
    return Response.json({
      data: [
        {
          name: "ENQ27",
          user_employee: "HR-EMP-00009",
          assigned_to_employee: "HR-EMP-00011"
        },
        {
          name: "ENQ26",
          user_employee: "HR-EMP-00009",
          assigned_to_employee: "HR-EMP-00013"
        }
      ]
    });
  };
  const result = await listLiveFrappeEnquiries(
    database("frappe"),
    defaults,
    "test-secret",
    { scope: "all", page: 1, pageSize: 100, search: "" },
    null,
    true
  );
  assert.equal(employeeRequests, 1);
  assert.deepEqual(
    result.items.map((item) => [item.creator, item.assignee]),
    [
      ["Vijay Anand", "Karthik D"],
      ["Vijay Anand", "HR-EMP-00013"]
    ]
  );
});

test("live detail reloads one Frappe enquiry and resolves employee names", async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname === "/api/resource/Employee")
      return Response.json({ data: [{ name: "EMP-1", employee_name: "Vijay Anand" }] });
    if (url.pathname === "/api/method/frappe.desk.form.load.get_docinfo")
      return Response.json({ docinfo: { versions: [], info_logs: [] } });
    assert.equal(url.pathname, "/api/resource/Enquiry/ENQ27");
    return Response.json({
      data: {
        name: "ENQ27",
        title: "Motor enquiry",
        enquiry_details: "Needs replacement motor",
        user_employee: "EMP-1",
        assigned_to_employee: "EMP-2"
      }
    });
  };
  const result = await getLiveFrappeEnquiry(
    database("frappe"),
    defaults,
    "test-secret",
    "ENQ27",
    "EMP-1",
    false
  );
  assert.equal(result.title, "Motor enquiry");
  assert.equal(result.details, "Needs replacement motor");
  assert.equal(result.creator, "Vijay Anand");
  assert.equal(result.assignee, "EMP-2");
});

test("live detail denies a record outside the mapped employee", async () => {
  globalThis.fetch = async () =>
    Response.json({
      data: { name: "ENQ27", user_employee: "EMP-2", assigned_to_employee: "EMP-3" }
    });
  await assert.rejects(
    () =>
      getLiveFrappeEnquiry(database("frappe"), defaults, "test-secret", "ENQ27", "EMP-1", false),
    /cannot view this enquiry/
  );
});

test("live navigation count remains available to a view-all user without an employee mapping", async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/api/resource/Enquiry");
    assert.equal(url.searchParams.get("group_by"), "status");
    assert.deepEqual(JSON.parse(url.searchParams.get("filters") ?? "[]"), []);
    return Response.json({
      data: [
        { status: "New", count: 16 },
        { status: "Closed", count: 11 }
      ]
    });
  };
  const source = new FrappeCrmEnquirySource(
    database("frappe"),
    defaults,
    "test-secret",
    true,
    "tenant@example.com",
    true,
    async () => null
  );
  assert.deepEqual(await source.summary("2026-10-11"), {
    allCount: 27,
    assigned: { total: 0, statusCounts: [], priorityCounts: [] },
    created: { total: 0, statusCounts: [], priorityCounts: [] }
  });
});

test("mapped Frappe overview counts recent creation and updates from live records", async () => {
  const dateFilters: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const filters = JSON.parse(url.searchParams.get("filters") ?? "[]") as string[][];
    for (const filter of filters)
      if (filter[0] === "creation" || filter[0] === "modified") dateFilters.push(filter[0]);
    const field = url.searchParams.get("group_by") === "priority" ? "priority" : "status";
    return Response.json({ data: [{ [field]: field === "status" ? "New" : "Normal", count: 1 }] });
  };
  const source = new FrappeCrmEnquirySource(
    database("frappe"),
    defaults,
    "test-secret",
    true,
    "tenant@example.com",
    true,
    async () => "EMP-1"
  );
  const summary = await source.summary("2026-10-11");
  assert.ok("created7" in summary.assigned);
  assert.ok("created7" in summary.created);
  assert.equal(summary.assigned.created7, 1);
  assert.equal(summary.assigned.updated30, 1);
  assert.equal(summary.created.created30, 1);
  assert.equal(summary.created.updated7, 1);
  assert.equal(dateFilters.filter((field) => field === "creation").length, 4);
  assert.equal(dateFilters.filter((field) => field === "modified").length, 4);
});

test("local source never makes a live Frappe request", async () => {
  globalThis.fetch = async () => {
    throw new Error("unexpected request");
  };
  await assert.rejects(
    () =>
      listLiveFrappeEnquiries(database("local"), defaults, "test-secret", query, "EMP-1", false),
    /set to Local/
  );
});

test("personal live views require a Frappe employee mapping", async () => {
  globalThis.fetch = async () => {
    throw new Error("unexpected request");
  };
  await assert.rejects(
    () => listLiveFrappeEnquiries(database("frappe"), defaults, "test-secret", query, null, false),
    /Map this CRM user/
  );
});

test("all enquiries for a restricted user use Frappe employee OR filters", async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.deepEqual(JSON.parse(url.searchParams.get("or_filters") ?? "[]"), [
      ["assigned_to_employee", "=", "EMP-1"],
      ["user_employee", "=", "EMP-1"]
    ]);
    return Response.json({ data: [] });
  };
  await listLiveFrappeEnquiries(
    database("frappe"),
    defaults,
    "test-secret",
    { ...query, scope: "all" },
    "EMP-1",
    false
  );
});

test("live report drilldown applies group, assignee, status and date filters", async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    assert.deepEqual(JSON.parse(url.searchParams.get("filters") ?? "[]"), [
      ["group", "=", "Service"],
      ["assigned_to_employee", "=", "EMP-2"],
      ["date", ">=", "2026-10-01"],
      ["date", "<=", "2026-10-10"],
      ...(url.searchParams.has("group_by") ? [] : [["status", "=", "New"]])
    ]);
    return Response.json({
      data: url.searchParams.has("group_by") ? [{ status: "New", count: 1 }] : []
    });
  };
  await listLiveFrappeEnquiries(
    database("frappe"),
    defaults,
    "test-secret",
    {
      scope: "all",
      page: 1,
      pageSize: 50,
      search: "",
      status: "New",
      group: "Service",
      assignee: "EMP-2",
      fromDate: "2026-10-01",
      toDate: "2026-10-10"
    },
    null,
    true
  );
});

test("live column filters and grouped status use matching Frappe counts", async () => {
  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    const filters = JSON.parse(url.searchParams.get("filters") ?? "[]");
    assert.deepEqual(filters.slice(0, 4), [
      ["customer", "like", "%Acme%"],
      ["due_date", "like", "%2026-10-14%"],
      ["priority", "like", "%Urgent%"],
      ["assigned_to_employee", "like", "%EMP-2%"]
    ]);
    if (url.searchParams.has("group_by"))
      return Response.json({
        data: [
          { status: "New", count: 2 },
          { status: "Open", count: 3 },
          { status: "Won", count: 1 }
        ]
      });
    assert.deepEqual(filters[4], ["status", "in", ["New", "Open"]]);
    return Response.json({ data: [{ name: "ENQ-1", title: "First" }] });
  };
  const result = await listLiveFrappeEnquiries(
    database("frappe"),
    defaults,
    "test-secret",
    {
      scope: "all",
      page: 1,
      pageSize: 100,
      search: "",
      status: "active",
      searchCustomer: "Acme",
      searchDueDate: "14-10-2026",
      searchPriority: "Urgent",
      searchAssignedTo: "EMP-2"
    },
    null,
    true
  );
  assert.equal(result.total, 5);
  assert.deepEqual(result.statusCounts, [
    { code: "New", count: 2 },
    { code: "Open", count: 3 },
    { code: "Won", count: 1 }
  ]);
});
