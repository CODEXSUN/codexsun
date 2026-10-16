import assert from "node:assert/strict";
import test from "node:test";
import { SalesService } from "./sales.service.js";
import { SalesRepository } from "./sales.repository.js";
import { BillingSettingsRepository } from "../settings/settings.repository.js";
import { ExportSalesService } from "../export-sales/export-sales.service.js";
import { ExportSalesRepository } from "../export-sales/export-sales.repository.js";
import { env } from "../../env.js";
import { buildEinvoicePayload, buildEwayPayload } from "./sales.whitebooks-payload.js";
import { buildEinvoicePayload as buildExportPayload } from "../export-sales/export-sales.whitebooks-payload.js";
import * as salesClient from "./whitebooks.client.js";
import * as exportClient from "../export-sales/export-sales-whitebooks.client.js";
import type { Sale } from "./sales.types.js";
import type { ExportSale } from "../export-sales/export-sales.types.js";
import type { ComplianceParties } from "./sales.compliance-parties.js";

const parties: ComplianceParties = {
  seller: {
    gstin: "29AAGCB1286Q000",
    name: "Sandbox seller",
    address: { addressLine1: "1 Main Road", cityName: "Bengaluru", pincodeName: "560001" }
  },
  buyer: {
    addressLine1: "2 Main Road",
    cityName: "Bengaluru",
    pincodeName: "560002",
    stateCode: "29",
    countryCode: "IN"
  },
  shipping: {
    addressLine1: "2 Main Road",
    cityName: "Bengaluru",
    pincodeName: "560002",
    stateCode: "29",
    countryCode: "IN"
  }
};
const invoice = {
  status: "confirmed",
  currencyCode: "INR",
  issuedOn: "2026-10-16",
  invoiceNumber: "TEST/1",
  customerName: "Sandbox buyer",
  customerGstin: "29AWGPV7107B1Z1",
  billingAddressId: 1,
  shippingAddressId: 1,
  taxType: "cgst-sgst",
  subtotal: 100,
  taxAmount: 18,
  amount: 118,
  roundOff: 0,
  einvoice: { irn: "" },
  eway: {
    vehicleNo: "KA01AB1234",
    transportGst: "",
    transport: "",
    part: "Part B",
    billNo: "",
    billDate: "",
    notes: "",
    status: "not-generated",
    transportId: null
  },
  items: [
    {
      description: "Goods",
      hsnCode: "1001",
      quantity: 1,
      unit: "NOS",
      rate: 100,
      taxableAmount: 100,
      taxRate: 18,
      cgstAmount: 9,
      sgstAmount: 9,
      igstAmount: 0,
      lineTotal: 118
    }
  ]
} as Sale;

test("domestic invoice sends registered buyer, complete addresses, dates and reconciled taxes", () => {
  const payload = buildEinvoicePayload(invoice, parties);
  assert.equal(payload.TranDtls.SupTyp, "B2B");
  assert.equal(payload.DocDtls.Dt, "16/10/2026");
  assert.equal(payload.BuyerDtls.Gstin, invoice.customerGstin);
  assert.equal(payload.SellerDtls.Pin, 560001);
  assert.equal(payload.ItemList[0]?.TotItemVal, 118);
  assert.equal(payload.ValDtls.CgstVal, 9);
  assert.equal(payload.ValDtls.SgstVal, 9);
  assert.throws(
    () => buildEinvoicePayload({ ...invoice, customerGstin: "" }, parties),
    /registered customer/
  );
  assert.throws(() => buildEinvoicePayload({ ...invoice, currencyCode: "USD" }, parties), /INR/);
  assert.throws(
    () =>
      buildEinvoicePayload({ ...invoice, items: [{ ...invoice.items[0]!, hsnCode: "" }] }, parties),
    /HSN/
  );
});

test("export invoice uses export supply type and overseas buyer codes", () => {
  const payload = buildExportPayload(invoice as unknown as ExportSale, parties);
  assert.equal(payload.TranDtls.SupTyp, "EXPWP");
  assert.equal(payload.BuyerDtls.Gstin, "URP");
  assert.equal(payload.BuyerDtls.Pos, "96");
  assert.equal(payload.BuyerDtls.Pin, 999999);
});

test("standalone E-way works without IRN and requires transport details", () => {
  const payload = buildEwayPayload(invoice, parties, 100);
  assert.equal("docDate" in payload && payload.docDate, "16/10/2026");
  assert.equal("totInvValue" in payload && payload.totInvValue, 118);
  const unregistered = buildEwayPayload({ ...invoice, customerGstin: "" }, parties, 100);
  assert.equal("toGstin" in unregistered && unregistered.toGstin, "URP");
  assert.throws(
    () => buildEwayPayload({ ...invoice, eway: { ...invoice.eway, vehicleNo: "" } }, parties, 100),
    /vehicle/
  );
  const linked = buildEwayPayload(
    { ...invoice, einvoice: { ...invoice.einvoice, irn: "a".repeat(64) } },
    parties,
    100
  );
  assert.equal("VehType" in linked && linked.VehType, "R");
  assert.equal("TransDocNo" in linked, false);
});

for (const [name, client] of [
  ["sales", salesClient],
  ["export", exportClient]
] as const) {
  test(`${name} rejects outer failures, nested failures, malformed data and normalizes provider dates`, () => {
    assert.throws(
      () =>
        client.assertProviderSuccess({
          status_cd: "0",
          status_desc: "Invalid credentials",
          data: {}
        }),
      /Invalid credentials/
    );
    assert.throws(
      () =>
        client.assertProviderSuccess({
          status_cd: "1",
          data: { Status: 0, ErrorDetails: [{ ErrorCode: "2150" }] }
        }),
      /2150/
    );
    assert.throws(
      () => client.assertProviderSuccess({ status_cd: "1", data: "not json" }),
      /invalid/
    );
    assert.deepEqual(client.responseData({ status_cd: "1", data: '{"AckNo":123}' }), {
      AckNo: 123
    });
    assert.equal(client.storageDate("16/10/2026 10:20:30", true), "2026-10-16T10:20:30");
    assert.equal(client.storageDate("2026-10-16T10:20:30", false), "2026-10-16");
    assert.equal(client.storageDate("16/10/2026 02:20:30 PM", true), "2026-10-16T14:20:30");
    assert.throws(() => client.storageDate("31/02/2026", true), /calendar/);
  });
}

test("mocked HTTP verifies authentication, IRN, standalone E-way and incomplete response rejection", async () => {
  const originalEnv = { ...env };
  const originalFetch = globalThis.fetch;
  Object.assign(env, {
    GSP_ENVIRONMENT: "sandbox",
    GSP_SANDBOX_BASE_URL: "https://apisandbox.whitebooks.in",
    GSP_GSTIN: parties.seller.gstin,
    GSP_EMAIL: "test@example.invalid",
    GSP_USERNAME: "test-user",
    GSP_PASSWORD: "test-password",
    GSP_CLIENT_ID: "test-client",
    GSP_CLIENT_SECRET: "test-secret",
    GSP_IP_ADDRESS: "127.0.0.1",
    CODEXSUN_WHITEBOOKS_EWAY_CLIENT_ID: "test-eway-client",
    CODEXSUN_WHITEBOOKS_EWAY_CLIENT_SECRET: "test-eway-secret"
  });
  const calls: { url: URL; options: RequestInit | undefined }[] = [];
  let incomplete = false;
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    calls.push({ url, options });
    if (url.pathname.endsWith("authenticate"))
      return Response.json({ status_cd: "1", data: { AuthToken: "test-token" } });
    return Response.json({
      status_cd: "1",
      data: incomplete
        ? {}
        : url.pathname.includes("genewaybill")
          ? { ewayBillNo: 123456789012, ewayBillDate: "16/10/2026 10:20:30" }
          : {
              Irn: "a".repeat(64),
              AckNo: 12345,
              AckDt: "2026-10-16 10:20:30",
              SignedQRCode: "signed-qr"
            }
    });
  };
  try {
    const result = await salesClient.generateSaleEinvoice(invoice, parties);
    assert.equal(result.einvoice?.status, "generated");
    assert.equal(new Headers(calls[0]?.options?.headers).get("password"), "test-password");
    assert.equal(new Headers(calls[1]?.options?.headers).get("auth-token"), "test-token");
    assert.equal(new Headers(calls[1]?.options?.headers).has("password"), false);
    assert.equal(
      (await salesClient.generateSaleEway(invoice, parties, 100)).eway?.billDate,
      "2026-10-16"
    );
    assert.equal(calls[2]?.url.pathname, "/ewaybillapi/v1.03/authenticate");
    assert.equal(calls[2]?.url.searchParams.get("password"), "test-password");
    assert.equal(new Headers(calls[2]?.options?.headers).get("client_id"), "test-eway-client");
    assert.equal(new Headers(calls[3]?.options?.headers).has("password"), false);
    incomplete = true;
    await assert.rejects(() => salesClient.generateSaleEinvoice(invoice, parties), /incomplete/);
    await assert.rejects(() => salesClient.generateSaleEway(invoice, parties, 100), /valid E-way/);
    const count = calls.length;
    await assert.rejects(
      () =>
        salesClient.generateSaleEinvoice(invoice, {
          ...parties,
          seller: { ...parties.seller, gstin: "33AAGCB1286Q000" }
        }),
      /does not match/
    );
    assert.equal(calls.length, count);
  } finally {
    globalThis.fetch = originalFetch;
    Object.assign(env, originalEnv);
  }
});

test("services preserve existing compliance and reject local destructive changes", async () => {
  let writes = 0;
  const saved = {
    ...invoice,
    einvoice: { ...invoice.einvoice, irn: "a".repeat(64), status: "generated" },
    eway: { ...invoice.eway, billNo: "123456789012", status: "generated" }
  };
  const repository = {
    get: async () => saved,
    updateCompliance: async () => {
      writes += 1;
      return saved;
    }
  };
  const settings = {
    getBillingSettings: async () => ({ layout: { useEinvoice: true, useEway: true } })
  } as unknown as BillingSettingsRepository;
  const sales = new SalesService(repository as unknown as SalesRepository, settings);
  const exports = new ExportSalesService(repository as unknown as ExportSalesRepository, settings);
  assert.equal(await sales.generateEinvoice("test", "invoice"), saved);
  assert.equal(await sales.generateEway("test", "invoice"), saved);
  assert.equal(await exports.generateEinvoice("test", "invoice"), saved);
  assert.equal(await exports.generateEway("test", "invoice"), saved);
  await assert.rejects(() => sales.cancelSale("test", "invoice"), /provider/);
  await assert.rejects(() => sales.revokeSale("test", "invoice"), /generated/);
  await assert.rejects(() => sales.clearEinvoice("test", "invoice"), /cannot be cleared/);
  await assert.rejects(() => sales.clearEway("test", "invoice"), /cannot be cleared/);
  await assert.rejects(() => exports.cancelExportSale("test", "invoice"), /provider/);
  await assert.rejects(() => exports.revokeExportSale("test", "invoice"), /generated/);
  assert.equal(writes, 0);
});
