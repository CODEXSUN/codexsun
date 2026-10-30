import assert from "node:assert/strict";
import test from "node:test";
import { router } from "./router";

test("tenant, billing, and core deep links match the intended routes", () => {
  const cases = new Map([
    ["/app/qcafe", "/app/$"],
    ["/app/task-manager/overview", "/app/$"],
    ["/app/crm/overview", "/app/$"],
    ["/app/crm/call-logs", "/app/$"],
    ["/app/crm/contacts", "/app/$"],
    ["/app/crm/contacts/new", "/app/$"],
    ["/app/crm/contacts/1/edit", "/app/$"],
    ["/app/crm/contacts/1/show", "/app/$"],
    ["/app/crm/contact-360", "/app/$"],
    ["/app/logicx-erp/schemes", "/app/$"],
    ["/app/hrms/employees", "/app/$"],
    ["/app/hrms/employees/new", "/app/$"],
    ["/app/hrms/employees/1a2b3c4d/edit", "/app/$"],
    ["/app/logicx-erp/schemes/new", "/app/$"],
    ["/app/logicx-erp/schemes/1a2b3c4d", "/app/$"],
    ["/app/logicx-erp/schemes/1a2b3c4d/edit", "/app/$"],
    ["/app/billing/quotation", "/app/billing/quotation"],
    ["/app/billing/quotation/new", "/app/billing/quotation/new"],
    ["/app/billing/quotation/1", "/app/billing/quotation/$quotationId"],
    ["/app/billing/quotation/1/edit", "/app/billing/quotation/$quotationId/edit"],
    ["/app/billing/quotation/1/show", "/app/billing/quotation/$quotationId/show"],
    ["/app/billing/quotation/1/print", "/app/billing/quotation/$quotationId/print"],
    ["/app/billing/sales/new", "/app/billing/sales/new"],
    ["/app/billing/sales/1/edit", "/app/billing/sales/$recordId/edit"],
    ["/app/billing/sales/1/print", "/app/billing/sales/$recordId/print"],
    ["/app/billing/purchase/1", "/app/billing/purchase/$recordId"],
    ["/app/billing/export-sales/1/print", "/app/billing/export-sales/$recordId/print"],
    ["/app/billing/payment/1/edit", "/app/billing/payment/$recordId/edit"],
    ["/app/billing/receipt/1/print", "/app/billing/receipt/$recordId/print"],
    ["/app/core/master/contact/new", "/app/$"],
    ["/app/core/common/location/countries/1/edit", "/app/$"],
    ["/app/core/common/products/units/1/edit", "/app/$"]
  ]);

  for (const [path, routeId] of cases) {
    assert.equal(router.matchRoutes(path).at(-1)?.routeId, routeId, path);
  }
});

test("record search values use ordinary URL query strings", () => {
  const location = router.buildLocation({
    params: { _splat: "auditor/clients" },
    search: { record: "12" },
    to: "/app/$"
  });
  assert.equal(location.href, "/app/auditor/clients?record=12");
});

test("Application access forms retain their deep links", () => {
  for (const module of ["users", "roles", "permissions", "user-roles", "role-permissions"]) {
    for (const suffix of ["", "/new", "/5/edit"]) {
      const path = `/app/application/access/${module}${suffix}`;
      assert.equal(router.matchRoutes(path).at(-1)?.routeId, "/app/$", path);
    }
  }
});

test("Application list searches round trip punctuation and column controls", () => {
  const location = router.buildLocation({
    to: "/app/$",
    params: { _splat: "application/access/roles" },
    search: {
      q: "A & B / team",
      status: "active",
      columnSearch: "1",
      "column.label": "Audit & review",
      hidden: "key",
      page: "2",
      pageSize: "25"
    }
  });
  const parsed = router.options.parseSearch!(new URL(location.href, "http://localhost").search);
  assert.equal(parsed.q, "A & B / team");
  assert.equal(parsed["column.label"], "Audit & review");
  assert.equal(parsed.status, "active");
  assert.equal(parsed.hidden, "key");
  assert.equal(String(parsed.columnSearch), "1");
  assert.equal(String(parsed.page), "2");
  assert.equal(String(parsed.pageSize), "25");
});
