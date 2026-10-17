import assert from "node:assert/strict";
import { sql } from "kysely";
import { getBillingDatabase } from "../../../database/billing-database.js";
import { withBillingScope } from "../../../auth/billing-scope.js";
import { SalesService } from "../../sales/sales.service.js";
import { ExportSalesService } from "../../export-sales/export-sales.service.js";
import { PurchaseService } from "../../purchase/purchase.service.js";
import { ReceiptService } from "../../receipt/receipt.service.js";
import { PaymentService } from "../../payment/payment.service.js";
import { DashboardService } from "../../dashboard/dashboard.service.js";
import { DashboardRepository } from "../../dashboard/dashboard.repository.js";
import { CustomerSummaryService } from "./customer-summary.service.js";
import { SupplierSummaryService } from "../supplier-summary/supplier-summary.service.js";
import { CustomerStatementService } from "../customer-statement/customer-statement.service.js";
import { SupplierStatementService } from "../supplier-statement/supplier-statement.service.js";
import { StockStatementService } from "../stock-statement/stock-statement.service.js";
import { GstStatementService } from "../gst-statement/gst-statement.service.js";

export async function verifyCurrencyReports(databaseName: string, saleId: string) {
  const db = await getBillingDatabase(databaseName);
  await sql`ALTER TABLE core_contacts ADD COLUMN IF NOT EXISTS code VARCHAR(24) DEFAULT 'QA', ADD COLUMN IF NOT EXISTS type_name VARCHAR(80) DEFAULT 'Customer Supplier'`.execute(
    db
  );
  await sql`ALTER TABLE core_products ADD COLUMN IF NOT EXISTS opening_qty DECIMAL(14,4) DEFAULT 0`.execute(
    db
  );
  const sales = new SalesService(),
    exports = new ExportSalesService(),
    purchases = new PurchaseService();
  const base = (await sales.getSale(databaseName, saleId))!;
  const scope = (code: string, companyId = 1, financialYearId = 1) => ({
    companyId,
    financialYearId,
    reportCurrencyCode: code
  });
  const summaries = new CustomerSummaryService(),
    suppliers = new SupplierSummaryService(),
    dashboard = new DashboardService();
  const beforeInr = await summaries.get(databaseName);
  const beforeUsd = await withBillingScope(scope("USD"), () => summaries.get(databaseName));
  for (const [currencyId, currencyCode, price] of [
    [1, "INR", 100],
    [2, "USD", 7]
  ] as const) {
    const input = {
      ...base,
      invoiceNumber: `CC-${currencyCode}`,
      currencyId,
      currencyCode,
      status: "draft" as const,
      issuedOn: "2026-10-01",
      items: [{ ...base.items[0]!, quantity: 1, rate: price }],
      einvoice: { irn: "", ackNo: "", ackDate: "", signedQr: "", status: "not-generated" as const },
      eway: { ...base.eway, billNo: "", billDate: "", status: "not-generated" as const }
    };
    if (currencyCode !== "INR") {
      await assert.rejects(() => sales.createSale(databaseName, input), /INR only/);
      await assert.rejects(
        () => sales.createSale(databaseName, { ...input, currencyCode: "INR" }),
        /active INR currency/
      );
    }
    const sale =
      currencyCode === "INR"
        ? await sales.createSale(databaseName, input)
        : await exports.createExportSale(databaseName, input);
    if (currencyCode === "INR") await sales.confirmSale(databaseName, sale.id);
    else await exports.confirmExportSale(databaseName, sale.id);
    const purchase = await purchases.create(databaseName, {
      ...input,
      supplierId: 1,
      supplierName: "E2E Customer",
      supplierPhone: "",
      supplierEmail: "",
      eway: undefined,
      einvoice: undefined
    });
    await purchases.confirm(databaseName, purchase.id);
    const common = {
      companyId: 1,
      financialYearId: 1,
      currencyId,
      ledgerId: 1,
      amount: currencyId === 1 ? 10 : 2,
      tdsAmount: 0,
      discountAmount: 0,
      roundOff: 0,
      referenceDate: "",
      referenceNo: "",
      notes: "Currency regression"
    };
    const receipts = new ReceiptService();
    const receipt = await receipts.create(databaseName, {
      ...common,
      customerId: 1,
      receiptNumber: `CC-R-${currencyCode}`,
      receiptDate: "2026-10-01",
      receiptMode: "cash",
      allocations: [
        {
          documentKind: currencyCode === "INR" ? "sale" : "export-sale",
          saleId: sale.id,
          allocatedAmount: common.amount
        }
      ]
    });
    await receipts.post(databaseName, receipt.id);
    const payments = new PaymentService();
    const payment = await payments.create(databaseName, {
      ...common,
      supplierId: 1,
      paymentNumber: `CC-P-${currencyCode}`,
      paymentDate: "2026-10-01",
      paymentMode: "cash",
      allocations: [{ purchaseId: purchase.id, allocatedAmount: common.amount }]
    });
    await payments.post(databaseName, payment.id);
  }
  const guardedDraft = await sales.createSale(databaseName, {
    ...base,
    invoiceNumber: "CC-INR-GUARD",
    status: "draft",
    einvoice: { irn: "", ackNo: "", ackDate: "", signedQr: "", status: "not-generated" },
    eway: { ...base.eway, billNo: "", billDate: "", status: "not-generated" }
  });
  await assert.rejects(
    () =>
      sales.updateSale(databaseName, guardedDraft.id, {
        ...guardedDraft,
        currencyId: 2,
        currencyCode: "INR"
      }),
    /active INR currency/
  );
  await sql`UPDATE billing_sales SET currency_id=2 WHERE uuid=${guardedDraft.id}`.execute(db);
  try {
    await assert.rejects(() => sales.confirmSale(databaseName, guardedDraft.id), /INR only/);
  } finally {
    await sql`UPDATE billing_sales SET currency_id=1 WHERE uuid=${guardedDraft.id}`.execute(db);
  }
  await withBillingScope(scope("USD"), async () => {
    const summary = await summaries.get(databaseName);
    assert.equal(summary.currencyCode, "USD");
    assert.equal(summary.totalDebit - beforeUsd.totalDebit, 8.26);
    assert.equal(summary.totalCredit - beforeUsd.totalCredit, 2);
    const supplier = await suppliers.get(databaseName);
    assert.equal(supplier.totalCredit, 8.26);
    assert.equal(supplier.totalDebit, 2);
    const customer = await new CustomerStatementService().get(databaseName, {
      contactId: 1,
      page: 1,
      pageSize: 50
    });
    assert.equal(customer.openingBalance, 0);
    assert.equal(customer.closingBalance, 6.26);
    assert.equal(customer.periodDebit, 8.26);
    assert.equal(customer.periodCredit, 2);
    const statement = await new SupplierStatementService().get(databaseName, {
      contactId: 1,
      page: 1,
      pageSize: 50
    });
    assert.equal(statement.openingBalance, 0);
    assert.equal(statement.closingBalance, 6.26);
    const view = (await dashboard.get(databaseName))!;
    assert.equal(view.currencyCode, "USD");
    assert.equal(view.metrics.sales.total, 8.26);
    assert.equal(view.metrics.purchase.total, 8.26);
    assert.equal(view.metrics.receipt.total, 2);
    assert.equal(view.metrics.payment.total, 2);
    assert.ok(view.recent.every((row) => row.documentNumber.includes("USD")));
    assert.equal(
      view.outstanding.find((row) => row.direction === "receivable")?.outstandingAmount,
      6.26
    );
    assert.equal(
      view.monthly.reduce((sum, row) => sum + row.sales, 0),
      8.26
    );
    const stock = await new StockStatementService().get(databaseName, {
      page: 1,
      pageSize: 50,
      search: ""
    });
    assert.equal(stock.purchaseValue, 7);
    assert.equal(stock.salesValue, 7);
    const exported = await exports.createExportSale(databaseName, {
      ...base,
      invoiceNumber: "CC-EXPORT-USD",
      currencyId: 2,
      currencyCode: "USD",
      status: "draft",
      issuedOn: "2026-10-01",
      items: [{ ...base.items[0]!, quantity: 1, rate: 9 }],
      einvoice: { irn: "", ackNo: "", ackDate: "", signedQr: "", status: "not-generated" },
      eway: { ...base.eway, billNo: "", billDate: "", status: "not-generated" }
    });
    await exports.confirmExportSale(databaseName, exported.id);
    const receipts = new ReceiptService();
    const exportReceipt = await receipts.create(databaseName, {
      companyId: 1,
      financialYearId: 1,
      currencyId: 2,
      customerId: 1,
      ledgerId: 1,
      amount: 3,
      tdsAmount: 0,
      discountAmount: 0,
      roundOff: 0,
      referenceDate: "",
      referenceNo: "",
      notes: "Export allocation currency regression",
      receiptNumber: "CC-R-EXPORT-USD",
      receiptDate: "2026-10-01",
      receiptMode: "cash",
      allocations: [{ documentKind: "export-sale", saleId: exported.id, allocatedAmount: 3 }]
    });
    await receipts.post(databaseName, exportReceipt.id);
    const exportView = (await dashboard.get(databaseName))!;
    assert.equal(exportView.metrics.sales.total, 18.88);
    assert.equal(
      exportView.outstanding.find((row) => row.direction === "receivable")?.outstandingAmount,
      13.88
    );
    assert.equal((await summaries.get(databaseName)).totalBalance, 13.88);
    assert.equal(
      (
        await new CustomerStatementService().get(databaseName, {
          contactId: 1,
          page: 1,
          pageSize: 50
        })
      ).closingBalance,
      13.88
    );
    await assert.rejects(
      () => new GstStatementService().get(databaseName, { year: 2026, month: 10 }),
      /INR-only/
    );
  });
  const afterInr = await summaries.get(databaseName);
  assert.equal(afterInr.totalDebit - beforeInr.totalDebit, 118);
  assert.equal(afterInr.totalCredit - beforeInr.totalCredit, 10);
  const repo = new DashboardRepository();
  await sql`UPDATE billing_dashboard_snapshots SET projection_version=1,snapshot_json=JSON_SET(snapshot_json,'$.projectionVersion',1,'$.metrics.sales.total',999999) WHERE company_id=1 AND financial_year_id=1`.execute(
    db
  );
  const healed = (await dashboard.get(databaseName))!;
  assert.equal(healed.projectionVersion, 2);
  assert.equal(healed.currencyCode, "INR");
  assert.notEqual(healed.metrics.sales.total, 999999);
  assert.equal((await repo.get(databaseName, 1, 1))?.currencyCode, "INR");
  await withBillingScope(scope("USD", 2), async () =>
    assert.equal((await summaries.get(databaseName)).totalDebit, 0)
  );
  await withBillingScope(scope("USD", 2, 2), async () =>
    assert.equal((await summaries.get(databaseName)).totalDebit, 0)
  );
  const gst = await new GstStatementService().get(databaseName, { year: 2026, month: 10 });
  assert.equal(gst.currencyCode, "INR");
  assert.ok(gst.sales.documents.every((row) => !row.documentNumber.includes("USD")));
  assert.equal("generateEinvoice" in SalesService.prototype, false);
  assert.equal("generateEway" in ExportSalesService.prototype, false);
  console.log(
    "PASS: separated INR/USD summaries, statements, ageing, dashboard/cache, stock values, GST exclusion and scope isolation; synchronous service generation removed."
  );
}
