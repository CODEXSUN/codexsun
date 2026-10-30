import assert from "node:assert/strict";
import test from "node:test";
import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
Object.assign(globalThis, { React });

const { WorkspaceNavigationProvider } = await import("@codexsun/ui/workspace/navigation");
const { useCustomerSummaryControls } =
  await import("./reports/customer-summary/customer-summary.controls");
const { useSupplierSummaryControls } =
  await import("./reports/supplier-summary/supplier-summary.controls");
const { useCustomerStatementControls } =
  await import("./reports/customer-statement/customer-statement.controls");
const { useSupplierStatementControls } =
  await import("./reports/supplier-statement/supplier-statement.controls");
const { useStockStatementControls } =
  await import("./reports/stock-statement/stock-statement.controls");
const { useOpeningBalanceControls } = await import("./opening-balance/opening-balance.controls");
const { useGstStatementControls } = await import("./reports/gst-statement/gst-statement.controls");
import type { GstStatementPanel } from "./reports/gst-statement/gst-statement.types";

function controls<T>(read: () => T, search: Record<string, string> = {}): T {
  let result: T | undefined;
  function Probe() {
    result = read();
    return null;
  }
  renderToStaticMarkup(
    createElement(WorkspaceNavigationProvider, {
      headerTarget: null,
      search,
      onSearchChange: () => {},
      children: createElement(Probe)
    })
  );
  assert.ok(result);
  return result;
}

const balances = [-10, 0, 30].map((balance, index) => ({
  balance,
  code: `PARTY-${index}`,
  credit: 10,
  debit: 10 + balance,
  id: index + 1,
  name: `Party ${index}`
}));
test("customer and supplier summary searches combine with signed balance filters", () => {
  assert.deepEqual(
    controls(() => useCustomerSummaryControls(balances), { filter: "positive" }).entries.map(
      (entry) => entry.id
    ),
    [3]
  );
  assert.deepEqual(
    controls(() => useSupplierSummaryControls(balances), {
      filter: "negative",
      search: "party-0"
    }).entries.map((entry) => entry.id),
    [1]
  );
  assert.equal(
    controls(() => useCustomerSummaryControls(balances), {
      search: "party-0",
      "column.Code": "PARTY-2"
    }).entries.length,
    0
  );
  assert.equal(
    controls(() => useSupplierSummaryControls(balances), { filter: "zero" }).entries.length,
    1
  );
});

test("party statement filtering includes matches beyond the first display page without changing running balances", () => {
  const movements = Array.from({ length: 250 }, (_, index) => ({
    balance: index * 10,
    credit: 0,
    date: "2026-10-01",
    debit: 10,
    documentId: String(index),
    documentNumber: `INV-${index}`,
    kind: "sale" as const,
    narration: index === 240 ? "Target invoice" : "Invoice"
  }));
  const result = controls(() => useCustomerStatementControls(movements), {
    filter: "sale",
    search: "target"
  }).entries;
  assert.equal(result.length, 1);
  assert.equal(result[0]?.documentId, "240");
  assert.equal(result[0]?.balance, 2400);
  const supplier = movements.map((entry) => ({ ...entry, kind: "purchase" as const }));
  assert.equal(
    controls(() => useSupplierStatementControls(supplier), { filter: "payment" }).entries.length,
    0
  );
  assert.equal(
    controls(() => useSupplierStatementControls(supplier), {
      filter: "purchase",
      "column.Voucher": "INV-240"
    }).entries.length,
    1
  );
});

test("stock search and quantity filters preserve zero and negative stock", () => {
  const items = [-2, 0, 8].map((closingQuantity, index) => ({
    closingQuantity,
    hsnCode: "4401",
    inwardQuantity: 5,
    openingQuantity: 0,
    outwardQuantity: 5 - closingQuantity,
    productId: index,
    productName: `Product ${index}`,
    purchaseValue: 100,
    salesValue: 50,
    unitName: "Nos"
  }));
  const negative = controls(() => useStockStatementControls(items), { filter: "negative" });
  assert.equal(negative.entries[0]?.closingQuantity, -2);
  assert.equal(negative.totals.closingQuantity, -2);
  assert.equal(negative.totals.purchaseValue, 100);
  assert.equal(
    controls(() => useStockStatementControls(items), { filter: "zero", search: "product 1" })
      .entries.length,
    1
  );
  assert.equal(
    controls(() => useStockStatementControls(items), { "column.HSN": "missing" }).entries.length,
    0
  );
});

test("opening balances combine role, legacy source and currency searches", () => {
  const items = [false, true].map((assignLegacy, index) => ({
    assignLegacy,
    id: String(index),
    contactName: `Party ${index}`,
    contactId: index,
    currencyId: 1,
    currencyCode: "INR",
    companyId: 1,
    financialYearId: 1,
    partyRole: "customer" as const,
    amount: 500,
    reason: "Reviewed"
  }));
  assert.equal(
    controls(() => useOpeningBalanceControls(items), { filter: "legacy", search: "inr" }).entries[0]
      ?.id,
    "1"
  );
  assert.equal(
    controls(() => useOpeningBalanceControls(items), { filter: "supplier" }).entries.length,
    0
  );
  assert.equal(
    controls(() => useOpeningBalanceControls(items), { "column.Source": "manual" }).entries.length,
    1
  );
});

test("GST filters document and HSN tables without rewriting financial totals", () => {
  const panel: GstStatementPanel = {
    cgstAmount: 9,
    sgstAmount: 9,
    igstAmount: 0,
    invoiceTotal: 218,
    taxAmount: 18,
    taxableAmount: 200,
    documentCount: 2,
    documents: [0, 9].map((tax, index) => ({
      cgstAmount: tax,
      sgstAmount: tax,
      igstAmount: 0,
      invoiceTotal: 100 + tax * 2,
      taxableAmount: 100,
      contactName: `Party ${index}`,
      documentDate: "2026-10-01",
      documentNumber: `GST-${index}`,
      documentType: "sale",
      gstin: "",
      serial: index + 1,
      taxRates: [tax * 2]
    })),
    hsn: [0, 9].map((tax, index) => ({
      cgstAmount: tax,
      sgstAmount: tax,
      igstAmount: 0,
      taxableAmount: 100,
      totalQuantity: 1,
      hsnCode: String(index),
      productName: `Product ${index}`
    }))
  };
  const result = controls(() => useGstStatementControls(undefined), {
    filter: "taxed"
  }).filterPanel(panel);
  assert.equal(result?.documents.length, 1);
  assert.equal(result?.hsn.length, 1);
  assert.equal(result?.invoiceTotal, 218);
  assert.equal(panel.documents.length, 2);
  assert.equal(
    controls(() => useGstStatementControls(undefined), { search: "gst-1" }).filterPanel(panel)
      ?.documents.length,
    1
  );
});
