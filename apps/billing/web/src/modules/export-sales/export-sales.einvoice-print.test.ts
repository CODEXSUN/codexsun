import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExportSaleEinvoicePrint } from "./export-sales.einvoice-print";

test("ExportSale e-invoice renders signed QR, IRN, acknowledgement and cancellation history", () => {
  const einvoice = {
    irn: "a".repeat(64),
    ackNo: "112610278704526",
    ackDate: "2026-10-16T12:00:00",
    signedQr: "signed.payload.signature",
    status: "generated"
  };
  const render = (value: typeof einvoice) =>
    renderToStaticMarkup(createElement(ExportSaleEinvoicePrint, { einvoice: value }));
  const output = render(einvoice);
  assert.match(output, /<svg/);
  assert.match(output, /E-invoice signed QR code/);
  assert.ok(output.includes(einvoice.irn));
  assert.ok(output.includes(einvoice.ackNo));
  assert.ok(output.includes(einvoice.ackDate));
  assert.match(render({ ...einvoice, status: "cancelled" }), /CANCELLED/);
  assert.doesNotMatch(render({ ...einvoice, signedQr: "" }), /<svg/);
  assert.equal(render({ ...einvoice, irn: "" }), "");
  assert.notEqual(render({ ...einvoice, signedQr: "a".repeat(2200) }), "");
});
