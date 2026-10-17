import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

test("reporting currency isolates tenant/company/year, formats money and sends scoped headers", async () => {
  const reactBefore = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.defineProperty(globalThis, "React", { configurable: true, value: React });
  const windowBefore = Object.getOwnPropertyDescriptor(globalThis, "window"),
    storageBefore = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage"),
    fetchBefore = globalThis.fetch;
  const values = new Map<string, string>();
  let reloads = 0;
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key)
    }
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: { reload: () => reloads++ },
      __CODEXSUN_RUNTIME_CONFIG__: { VITE_PLATFORM_API_URL: "http://billing.example.invalid" }
    }
  });
  try {
    values.set("codexsun_tenant_id", "tenant-a");
    values.set("codexsun.tenant.company-id", "1");
    values.set("codexsun.tenant.financial-year-id", "1");
    const context = await import("./tenant-context");
    assert.equal(context.getReportCurrencyCode(), "INR");
    context.selectReportCurrencyCode("USD");
    assert.equal(reloads, 1);
    assert.equal(context.getReportCurrencyCode(), "USD");
    for (const [key, value] of [
      ["codexsun_tenant_id", "tenant-b"],
      ["codexsun.tenant.company-id", "2"],
      ["codexsun.tenant.financial-year-id", "2"]
    ] as const) {
      const before = values.get(key)!;
      values.set(key, value);
      assert.equal(context.getReportCurrencyCode(), "INR");
      values.set(key, before);
      assert.equal(context.getReportCurrencyCode(), "USD");
    }
    context.selectReportCurrencyCode("invalid");
    assert.equal(reloads, 1);
    const formatters = [
      (await import("../../modules/reports/customer-summary/customer-summary.services"))
        .formatCustomerSummaryMoney,
      (await import("../../modules/reports/supplier-summary/supplier-summary.services"))
        .formatSupplierSummaryMoney,
      (await import("../../modules/reports/customer-statement/customer-statement.services"))
        .formatCustomerStatementMoney,
      (await import("../../modules/reports/supplier-statement/supplier-statement.services"))
        .formatSupplierStatementMoney,
      (await import("../../modules/reports/stock-statement/stock-statement.services"))
        .formatStockStatementMoney
    ];
    for (const format of formatters) assert.match(format(7), /\$7\.00/);
    const requests: Headers[] = [];
    globalThis.fetch = async (_input, init) => {
      requests.push(new Headers(init?.headers));
      return Response.json({ success: true, data: {} });
    };
    const { billingApiGet } = await import("./billing-api");
    await billingApiGet("/billing/reports/customer-summary");
    await billingApiGet("/billing/dashboard");
    await billingApiGet("/billing/reports/gst-statement");
    await billingApiGet("/billing/reports/customer-summary/currencies");
    await billingApiGet("/billing/sales");
    assert.deepEqual(
      requests.map((headers) => headers.get("x-billing-report-currency")),
      ["USD", "USD", "INR", "INR", null]
    );
    context.selectReportCurrencyCode("INR");
    for (const format of formatters) assert.match(format(7), /\u20b97\.00/);
  } finally {
    if (reactBefore) Object.defineProperty(globalThis, "React", reactBefore);
    else Reflect.deleteProperty(globalThis, "React");
    globalThis.fetch = fetchBefore;
    if (windowBefore) Object.defineProperty(globalThis, "window", windowBefore);
    else Reflect.deleteProperty(globalThis, "window");
    if (storageBefore) Object.defineProperty(globalThis, "sessionStorage", storageBefore);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
