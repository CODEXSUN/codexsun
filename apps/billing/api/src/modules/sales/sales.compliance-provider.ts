import { AppError } from "@codexsun/framework/errors";
import { env } from "../../env.js";
import {
  assertSeller,
  authToken,
  callWhiteBooks,
  responseData,
  storageDate,
  generateSaleEinvoice,
  generateSaleEway
} from "./whitebooks.client.js";
import {
  buildEinvoicePayload,
  buildEwayPayload,
  providerDate
} from "./sales.whitebooks-payload.js";
import type { SalesComplianceSnapshot, SalesComplianceAction } from "./sales.compliance-types.js";

export function prepareSalesComplianceProvider(
  snapshot: SalesComplianceSnapshot,
  action: SalesComplianceAction
) {
  if (snapshot.environment !== env.GSP_ENVIRONMENT || snapshot.gstin !== env.GSP_GSTIN)
    throw AppError.conflict(
      "WhiteBooks environment or taxpayer changed. Restore the original account before processing this request."
    );
  assertSeller(snapshot.parties);
  const invoice = snapshot.invoice;
  if (action === "einvoice.generate") {
    if (invoice.einvoice.irn || invoice.einvoice.status === "cancelled")
      throw AppError.conflict("This invoice already has an IRN and cannot be generated again.");
    buildEinvoicePayload(invoice, snapshot.parties);
  }
  if (action === "eway.generate") {
    if (invoice.eway.status === "generated" || invoice.eway.status === "cancelled")
      throw AppError.conflict("This invoice already has an E-way result.");
    buildEwayPayload(invoice, snapshot.parties, snapshot.distanceKm);
  }
  if (action.endsWith(".cancel")) {
    if (
      !Number.isInteger(snapshot.reasonCode) ||
      snapshot.reasonCode < 1 ||
      snapshot.reasonCode > 4 ||
      snapshot.remarks.trim().length < 3 ||
      snapshot.remarks.length > 100
    )
      throw AppError.validation(
        "Choose a cancellation reason and enter 3 to 100 characters of remarks."
      );
    if (
      action === "einvoice.cancel" &&
      (!invoice.einvoice.irn || invoice.einvoice.status !== "generated")
    )
      throw AppError.conflict("Only a generated IRN can be cancelled.");
    if (action === "einvoice.cancel" && invoice.eway.status === "generated")
      throw AppError.conflict("Cancel the active E-way bill before cancelling the IRN.");
    if (action === "eway.cancel" && (!invoice.eway.billNo || invoice.eway.status !== "generated"))
      throw AppError.conflict("Only a generated E-way bill can be cancelled.");
  }
}

export async function runSalesComplianceProvider(
  snapshot: SalesComplianceSnapshot,
  action: SalesComplianceAction
): Promise<Record<string, unknown>> {
  prepareSalesComplianceProvider(snapshot, action);
  if (snapshot.reconcileOnly) return reconcileSalesComplianceProvider(snapshot, action);
  if (action === "einvoice.generate")
    return clean(await generateSaleEinvoice(snapshot.invoice, snapshot.parties));
  if (action === "eway.generate")
    return clean(await generateSaleEway(snapshot.invoice, snapshot.parties, snapshot.distanceKm));
  if (action === "einvoice.cancel") {
    const response = await callWhiteBooks(
      "/einvoice/type/CANCEL/version/V1_03",
      "POST",
      {
        Irn: snapshot.invoice.einvoice.irn,
        CnlRsn: String(snapshot.reasonCode),
        CnlRem: snapshot.remarks
      },
      await authToken(false)
    );
    const data = responseData(response);
    if (
      String(data.Irn ?? data.irn ?? "").toLowerCase() !==
        snapshot.invoice.einvoice.irn.toLowerCase() ||
      !(data.CancelDate ?? data.CnlDt)
    )
      throw new Error("WhiteBooks cancellation outcome is incomplete. Reconcile before retrying.");
    return {
      einvoice: { ...snapshot.invoice.einvoice, status: "cancelled" },
      cancelledAt: storageDate(data.CancelDate ?? data.CnlDt, true)
    };
  }
  const response = await callWhiteBooks(
    "/ewaybillapi/v1.03/ewayapi/canewb",
    "POST",
    {
      ewbNo: Number(snapshot.invoice.eway.billNo),
      cancelRsnCode: snapshot.reasonCode,
      cancelRmrk: snapshot.remarks
    },
    await authToken(true)
  );
  const data = responseData(response);
  if (
    String(data.ewayBillNo ?? data.EwbNo ?? data.ewbNo ?? "") !== snapshot.invoice.eway.billNo ||
    !(data.cancelDate ?? data.CancelDate)
  )
    throw new Error(
      "WhiteBooks E-way cancellation outcome is incomplete. Reconcile before retrying."
    );
  return {
    eway: { ...snapshot.invoice.eway, status: "cancelled" },
    cancelledAt: storageDate(data.cancelDate ?? data.CancelDate, true)
  };
}

async function reconcileSalesComplianceProvider(
  snapshot: SalesComplianceSnapshot,
  action: SalesComplianceAction
): Promise<Record<string, unknown>> {
  const invoice = snapshot.invoice;
  if (action.startsWith("einvoice.")) {
    const token = await authToken(false);
    const response = await callWhiteBooks(
      "/einvoice/type/GETIRNBYDOCDETAILS/version/V1_03",
      "GET",
      undefined,
      token,
      { param1: "INV" },
      { docnum: invoice.invoiceNumber, docdate: providerDate(invoice.issuedOn) }
    );
    let data = responseData(response);
    const irn = String(data.Irn ?? data.irn ?? "");
    if (!/^[a-f0-9]{64}$/i.test(irn))
      throw new Error(
        "No matching IRN was returned. The request remains under review; do not resubmit blindly."
      );
    if (invoice.einvoice.irn && invoice.einvoice.irn.toLowerCase() !== irn.toLowerCase())
      throw AppError.conflict("Provider IRN does not match the saved invoice.");
    data = responseData(
      await callWhiteBooks("/einvoice/type/GETIRN/version/V1_03", "GET", undefined, token, {
        param1: irn
      })
    );
    const cancelled =
      ["cnl", "cancelled"].includes(String(data.Status ?? data.status).toLowerCase()) ||
      Boolean(data.CancelDate);
    if (action === "einvoice.cancel") {
      if (!cancelled)
        throw AppError.conflict(
          "Provider IRN is still active. Cancellation was not confirmed; submit cancellation again."
        );
      return { einvoice: { ...invoice.einvoice, status: "cancelled" } };
    }
    if (cancelled)
      throw new Error("The provider IRN is cancelled. Review this invoice with an administrator.");
    if (!data.AckNo || !data.SignedQRCode || !data.AckDt)
      throw new Error("IRN recovery returned incomplete details. Keep the request under review.");
    return {
      einvoice: {
        irn,
        ackNo: String(data.AckNo),
        ackDate: storageDate(data.AckDt, true),
        signedQr: String(data.SignedQRCode),
        status: "generated"
      }
    };
  }
  let response: unknown;
  if (action === "eway.generate" && invoice.einvoice.irn)
    response = await callWhiteBooks(
      "/einvoice/type/GETEWAYBILLIRN/version/V1_03",
      "GET",
      undefined,
      await authToken(false),
      { param1: invoice.einvoice.irn }
    );
  else {
    const billNo = snapshot.billNo || invoice.eway.billNo;
    if (!/^\d{12}$/.test(billNo))
      throw AppError.validation(
        "Enter the provider E-way bill number to reconcile a standalone request."
      );
    response = await callWhiteBooks(
      "/ewaybillapi/v1.03/ewayapi/getewaybill",
      "GET",
      undefined,
      await authToken(true),
      { ewbNo: billNo }
    );
  }
  const data = responseData(response),
    billNo = String(data.EwbNo ?? data.ewayBillNo ?? data.ewbNo ?? "");
  if (!/^\d{12}$/.test(billNo))
    throw new Error("Provider returned no matching E-way bill. Keep the request under review.");
  if (!invoice.einvoice.irn || action === "eway.cancel") {
    if (
      String(data.docNo ?? "").toUpperCase() !== invoice.invoiceNumber.toUpperCase() ||
      String(data.fromGstin ?? "").toUpperCase() !== snapshot.gstin.toUpperCase()
    )
      throw AppError.conflict("E-way bill identity does not match this invoice and taxpayer.");
    if (invoice.eway.billNo && invoice.eway.billNo !== billNo)
      throw AppError.conflict("Provider E-way number does not match the invoice.");
  }
  const cancelled = String(data.status ?? data.Status).toUpperCase() === "CNL";
  if (action === "eway.cancel") {
    if (!cancelled)
      throw AppError.conflict(
        "Provider E-way bill is still active. Cancellation was not confirmed; submit cancellation again."
      );
    return { eway: { ...invoice.eway, status: "cancelled" } };
  }
  if (cancelled)
    throw new Error(
      "The provider E-way bill is cancelled. Review the invoice with an administrator."
    );
  return {
    eway: {
      ...invoice.eway,
      billNo,
      billDate: storageDate(data.EwbDt ?? data.ewayBillDate, false),
      status: "generated"
    }
  };
}
function clean(value: { einvoice?: unknown; eway?: unknown }) {
  return {
    ...(value.einvoice ? { einvoice: value.einvoice } : {}),
    ...(value.eway ? { eway: value.eway } : {})
  };
}
