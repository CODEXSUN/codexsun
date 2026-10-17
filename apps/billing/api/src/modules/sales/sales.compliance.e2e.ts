import { ExportSalesService } from "../export-sales/export-sales.service.js";
import {
  ExportSalesComplianceService,
  configureExportSalesComplianceRuntime
} from "../export-sales/export-sales.compliance-service.js";
import { ExportSalesComplianceRepository } from "../export-sales/export-sales.compliance-repository.js";
import { processExportSalesComplianceJob } from "../export-sales/export-sales.compliance-worker.js";
import assert from "node:assert/strict";
import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { env } from "../../env.js";
import { getBillingDatabase } from "../../database/billing-database.js";
import { withBillingScope } from "../../auth/billing-scope.js";
import { runQuotationE2e } from "../quotation/quotation.e2e.js";
import { SalesRepository } from "./sales.repository.js";
import { SalesService } from "./sales.service.js";
import {
  SalesComplianceService,
  configureSalesComplianceRuntime
} from "./sales.compliance-service.js";
import { SalesComplianceRepository } from "./sales.compliance-repository.js";
import { processSalesComplianceJob } from "./sales.compliance-worker.js";

await runQuotationE2e(async (databaseName, saleId) => {
  const savedEnv = { ...env },
    fetchBefore = globalThis.fetch;
  const service = new SalesService(),
    requests = new SalesComplianceService(),
    jobs = new SalesComplianceRepository();
  const base = await service.getSale(databaseName, saleId);
  assert.ok(base);
  const db = await getBillingDatabase(databaseName);
  Object.assign(env, {
    GSP_ENVIRONMENT: "sandbox",
    GSP_GSTIN: "33ABCDE1234F1Z5",
    GSP_CLIENT_ID: "test-client",
    GSP_CLIENT_SECRET: "test-secret",
    GSP_EMAIL: "test@example.invalid",
    GSP_USERNAME: "test-user",
    GSP_PASSWORD: "test-password",
    GSP_IP_ADDRESS: "127.0.0.1"
  });
  configureSalesComplianceRuntime(true);
  let postCount = 0,
    timeout = false,
    currentIrn = "b".repeat(64),
    recoveredDocDate = "01/01/2020",
    recoveredDocNo = "";
  globalThis.fetch = async (input, options) => {
    const path = new URL(String(input)).pathname;
    if (path.includes("authenticate"))
      return Response.json({ status_cd: "1", data: { AuthToken: "test-token" } });
    if (options?.method === "POST") postCount++;
    if (timeout && options?.method === "POST")
      throw new Error("simulated connection lost after provider accepted");
    if (path.includes("/getewaybill"))
      return Response.json({
        status_cd: "1",
        data: {
          ewayBillNo: 123456789014,
          ewayBillDate: "16/10/2026",
          docNo: recoveredDocNo,
          docDate: recoveredDocDate,
          fromGstin: env.GSP_GSTIN,
          status: "ACT"
        }
      });
    const body = options?.body ? JSON.parse(String(options.body)) : {};
    const data = path.includes("canewb")
      ? { ewayBillNo: body.ewbNo, cancelDate: "16/10/2026 12:00:00" }
      : path.includes("/CANCEL/")
        ? { Irn: body.Irn, CancelDate: "16/10/2026 12:00:00" }
        : path.includes("EWAYBILL")
          ? { EwbNo: 123456789013, EwbDt: "16/10/2026 12:00:00" }
          : {
              Irn: currentIrn,
              AckNo: 1234567890,
              AckDt: "16/10/2026 12:00:00",
              SignedQRCode: "test-qr",
              Status: "ACT"
            };
    return Response.json({ status_cd: "1", data });
  };
  const authorize = async () => undefined;
  async function fresh(number: string) {
    const invoice = await service.createSale(databaseName, {
      ...base!,
      invoiceNumber: number,
      status: "draft",
      einvoice: { irn: "", ackNo: "", ackDate: "", signedQr: "", status: "not-generated" },
      eway: {
        ...base!.eway,
        billNo: "",
        billDate: "",
        vehicleNo: "TN01AB1234",
        part: "Part B",
        status: "not-generated"
      }
    });
    return (await service.confirmSale(databaseName, invoice.id))!;
  }
  try {
    const invoice = await fresh("QUEUE-1");
    const [a, b] = await Promise.all([
      requests.request(databaseName, invoice.id, "einvoice.generate"),
      requests.request(databaseName, invoice.id, "einvoice.generate")
    ]);
    assert.equal(a.uuid, b.uuid);
    await assert.rejects(() => service.cancelSale(databaseName, invoice.id), /compliance request/);
    const before = postCount;
    await Promise.all([
      processSalesComplianceJob(databaseName, a.uuid, authorize),
      processSalesComplianceJob(databaseName, a.uuid, authorize)
    ]);
    assert.equal(postCount, before + 1);
    assert.equal((await jobs.read(databaseName, a.uuid)).status, "completed");
    assert.equal((await service.getSale(databaseName, invoice.id))?.einvoice.irn, "b".repeat(64));
    await assert.rejects(
      () => new SalesRepository().setStatus(databaseName, invoice.id, "cancelled"),
      /provider/
    );
    await assert.rejects(
      () => new SalesRepository().softDelete(databaseName, invoice.id),
      /status changed/
    );
    const generatedInvoice = (await service.getSale(databaseName, invoice.id))!;
    await assert.rejects(
      () =>
        new SalesRepository().update(
          databaseName,
          invoice.id,
          { ...generatedInvoice, einvoice: base!.einvoice, eway: base!.eway },
          generatedInvoice
        ),
      /generated compliance/
    );
    const eway = await requests.request(databaseName, invoice.id, "eway.generate", {
      distanceKm: 100
    });
    await processSalesComplianceJob(databaseName, eway.uuid, authorize);
    const ewayJob = await jobs.read(databaseName, eway.uuid);
    assert.equal(ewayJob.status, "completed", ewayJob.error);
    await assert.rejects(
      () =>
        requests.request(databaseName, invoice.id, "einvoice.cancel", {
          reasonCode: 3,
          remarks: "Order cancelled"
        }),
      /E-way/
    );
    const cancelEway = await requests.request(databaseName, invoice.id, "eway.cancel", {
      reasonCode: 2,
      remarks: "Order cancelled"
    });
    await processSalesComplianceJob(databaseName, cancelEway.uuid, authorize);
    assert.equal((await service.getSale(databaseName, invoice.id))?.eway.status, "cancelled");
    const cancelIrn = await requests.request(databaseName, invoice.id, "einvoice.cancel", {
      reasonCode: 3,
      remarks: "Order cancelled"
    });
    await processSalesComplianceJob(databaseName, cancelIrn.uuid, authorize);
    assert.equal((await service.getSale(databaseName, invoice.id))?.einvoice.status, "cancelled");
    assert.equal((await service.getSale(databaseName, invoice.id))?.einvoice.irn, "b".repeat(64));
    assert.equal((await service.cancelSale(databaseName, invoice.id))?.status, "cancelled");
    await assert.rejects(() => service.revokeSale(databaseName, invoice.id), /generated/);

    const uncertain = await fresh("QUEUE-2");
    timeout = true;
    currentIrn = "d".repeat(64);
    const lost = await requests.request(databaseName, uncertain.id, "einvoice.generate");
    await processSalesComplianceJob(databaseName, lost.uuid, authorize);
    assert.equal((await jobs.read(databaseName, lost.uuid)).status, "review");
    const count = postCount;
    timeout = false;
    await requests.reconcile(databaseName, uncertain.id, lost.uuid);
    await processSalesComplianceJob(databaseName, lost.uuid, authorize);
    assert.equal(postCount, count);
    assert.equal((await jobs.read(databaseName, lost.uuid)).status, "completed");
    assert.equal((await service.getSale(databaseName, uncertain.id))?.einvoice.irn, "d".repeat(64));

    timeout = true;
    const interruptedCancel = await requests.request(
      databaseName,
      uncertain.id,
      "einvoice.cancel",
      { reasonCode: 3, remarks: "Order cancelled" }
    );
    await processSalesComplianceJob(databaseName, interruptedCancel.uuid, authorize);
    assert.equal((await jobs.read(databaseName, interruptedCancel.uuid)).status, "review");
    timeout = false;
    const beforeCancelLookup = postCount;
    await requests.reconcile(databaseName, uncertain.id, interruptedCancel.uuid);
    await processSalesComplianceJob(databaseName, interruptedCancel.uuid, authorize);
    assert.equal(postCount, beforeCancelLookup);
    assert.equal((await jobs.read(databaseName, interruptedCancel.uuid)).status, "failed");
    const retryCancel = await requests.request(databaseName, uncertain.id, "einvoice.cancel", {
      reasonCode: 3,
      remarks: "Order cancelled"
    });
    await processSalesComplianceJob(databaseName, retryCancel.uuid, authorize);
    assert.equal((await service.getSale(databaseName, uncertain.id))?.einvoice.status, "cancelled");

    const interrupted = await fresh("QUEUE-3");
    const pending = await requests.request(databaseName, interrupted.id, "einvoice.generate");
    const claim = await jobs.claim(databaseName, pending.uuid);
    assert.ok(claim);
    await jobs.saveResult(databaseName, pending.uuid, claim.lease, {
      einvoice: {
        irn: "c".repeat(64),
        ackNo: "123",
        ackDate: "2026-10-16T12:00:00",
        signedQr: "test-qr",
        status: "generated"
      }
    });
    await sql`UPDATE billing_sales_compliance_jobs SET updated_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 6 MINUTE) WHERE uuid=${pending.uuid}`.execute(
      db
    );
    assert.ok((await jobs.dispatchable(databaseName)).some((job) => job.uuid === pending.uuid));
    const countBeforeReplay = postCount;
    await processSalesComplianceJob(databaseName, pending.uuid, authorize);
    assert.equal(postCount, countBeforeReplay);
    assert.equal(
      (await service.getSale(databaseName, interrupted.id))?.einvoice.irn,
      "c".repeat(64)
    );

    const localFailure = await fresh("QUEUE-LOCAL-FAIL");
    currentIrn = "f".repeat(64);
    const localJob = await requests.request(databaseName, localFailure.id, "einvoice.generate");
    const originalUpdate = SalesRepository.prototype.updateCompliance;
    try {
      SalesRepository.prototype.updateCompliance = async () => {
        throw AppError.conflict("Simulated local write conflict");
      };
      await processSalesComplianceJob(databaseName, localJob.uuid, authorize);
    } finally {
      SalesRepository.prototype.updateCompliance = originalUpdate;
    }
    assert.equal((await jobs.read(databaseName, localJob.uuid)).status, "review");
    await assert.rejects(
      () => service.cancelSale(databaseName, localFailure.id),
      /compliance request/
    );
    const postsBeforeReplay = postCount;
    await requests.reconcile(databaseName, localFailure.id, localJob.uuid);
    await processSalesComplianceJob(databaseName, localJob.uuid, authorize);
    assert.equal(postCount, postsBeforeReplay);
    assert.equal((await jobs.read(databaseName, localJob.uuid)).status, "completed");

    const standalone = await fresh("QUEUE-DATE");
    recoveredDocNo = standalone.invoiceNumber;
    timeout = true;
    const standaloneJob = await requests.request(databaseName, standalone.id, "eway.generate", {
      distanceKm: 100
    });
    await processSalesComplianceJob(databaseName, standaloneJob.uuid, authorize);
    timeout = false;
    await requests.reconcile(databaseName, standalone.id, standaloneJob.uuid, "123456789014");
    await processSalesComplianceJob(databaseName, standaloneJob.uuid, authorize);
    assert.equal((await jobs.read(databaseName, standaloneJob.uuid)).status, "review");
    const [year, month, day] = standalone.issuedOn.slice(0, 10).split("-");
    recoveredDocDate = `${day}/${month}/${year}`;
    await requests.reconcile(databaseName, standalone.id, standaloneJob.uuid, "123456789014");
    await processSalesComplianceJob(databaseName, standaloneJob.uuid, authorize);
    const recoveredStandalone = await jobs.read(databaseName, standaloneJob.uuid);
    assert.equal(recoveredStandalone.status, "completed", recoveredStandalone.error);

    const denied = await fresh("QUEUE-4");
    const deniedJob = await requests.request(databaseName, denied.id, "einvoice.generate");
    const countBeforeDenied = postCount;
    await processSalesComplianceJob(databaseName, deniedJob.uuid, async () => {
      throw AppError.forbidden("Permission revoked");
    });
    assert.equal(postCount, countBeforeDenied);
    assert.equal((await jobs.read(databaseName, deniedJob.uuid)).status, "failed");
    await assert.rejects(
      () =>
        withBillingScope({ companyId: 2, financialYearId: 1 }, () =>
          jobs.read(databaseName, deniedJob.uuid)
        ),
      /not found/
    );
    configureExportSalesComplianceRuntime(true);
    const exports = new ExportSalesService(),
      exportJobs = new ExportSalesComplianceRepository(),
      exportRequests = new ExportSalesComplianceService();
    const exported = await exports.createExportSale(databaseName, {
      ...base!,
      invoiceNumber: "QUEUE-EXPORT-1",
      status: "draft",
      einvoice: { irn: "", ackNo: "", ackDate: "", signedQr: "", status: "not-generated" },
      eway: {
        ...base!.eway,
        billNo: "",
        billDate: "",
        vehicleNo: "TN01AB1234",
        part: "Part B",
        status: "not-generated"
      }
    });
    await exports.confirmExportSale(databaseName, exported.id);
    currentIrn = "e".repeat(64);
    const exportJob = await exportRequests.request(databaseName, exported.id, "einvoice.generate");
    await processExportSalesComplianceJob(databaseName, exportJob.uuid, authorize);
    const exportResult = await exportJobs.read(databaseName, exportJob.uuid);
    assert.equal(exportResult.status, "completed", exportResult.error);
    const exportCancel = await exportRequests.request(
      databaseName,
      exported.id,
      "einvoice.cancel",
      { reasonCode: 3, remarks: "Order cancelled" }
    );
    await processExportSalesComplianceJob(databaseName, exportCancel.uuid, authorize);
    assert.equal(
      (await exports.getExportSale(databaseName, exported.id))?.einvoice.status,
      "cancelled"
    );
    await exports.cancelExportSale(databaseName, exported.id);
    configureExportSalesComplianceRuntime(false);
    console.log(
      "PASS: concurrent claims, invoice locking, ordered provider cancellation, timeout reconciliation, crash replay, live permission denial and company scope."
    );
  } finally {
    globalThis.fetch = fetchBefore;
    Object.assign(env, savedEnv);
    configureSalesComplianceRuntime(false);
  }
});
