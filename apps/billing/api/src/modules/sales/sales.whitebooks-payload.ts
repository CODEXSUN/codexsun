import { AppError } from "@codexsun/framework/errors";
import type { Sale } from "./sales.types.js";
import type { ComplianceAddress, ComplianceParties } from "./sales.compliance-parties.js";

export function buildEinvoicePayload(invoice: Sale, parties: ComplianceParties) {
  validateInvoice(invoice);
  const buyerGstin = invoice.customerGstin.trim().toUpperCase();
  if (!/^\d{2}[A-Z0-9]{13}$/.test(buyerGstin))
    throw AppError.validation(
      "E-invoices require a registered customer GSTIN. Use standalone E-way for unregistered customers."
    );
  const seller = addressPayload(parties.seller.address, parties.seller.gstin.slice(0, 2));
  const buyerState = parties.buyer.stateCode || buyerGstin.slice(0, 2);
  const buyer = addressPayload(parties.buyer, buyerState);
  const shipping = addressPayload(
    parties.shipping,
    parties.shipping.stateCode || invoice.customerGstin.slice(0, 2)
  );
  return {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: { Dt: providerDate(invoice.issuedOn), No: invoice.invoiceNumber, Typ: "INV" },
    SellerDtls: { ...seller, Gstin: parties.seller.gstin, LglNm: parties.seller.name },
    BuyerDtls: {
      ...buyer,
      Gstin: buyerGstin,
      LglNm: invoice.customerName,
      Pos: parties.shipping.stateCode || buyerState
    },
    ShipDtls: {
      ...shipping,
      Gstin: invoice.shippingContactGstin || undefined,
      LglNm: invoice.shippingContactName || invoice.customerName
    },
    ItemList: invoice.items.map((item, index) => ({
      SlNo: String(index + 1),
      PrdDesc: item.description,
      IsServc: item.hsnCode.startsWith("99") ? "Y" : "N",
      HsnCd: item.hsnCode,
      Qty: item.quantity,
      Unit: unitCode(item.unit),
      UnitPrice: item.rate,
      TotAmt: item.taxableAmount,
      AssAmt: item.taxableAmount,
      GstRt: item.taxRate,
      CgstAmt: item.cgstAmount,
      SgstAmt: item.sgstAmount,
      IgstAmt: item.igstAmount,
      TotItemVal: item.lineTotal
    })),
    ValDtls: {
      AssVal: invoice.subtotal,
      CgstVal: sum(invoice, "cgstAmount"),
      SgstVal: sum(invoice, "sgstAmount"),
      IgstVal: sum(invoice, "igstAmount"),
      RndOffAmt: invoice.roundOff,
      TotInvVal: invoice.amount
    }
  };
}

export function buildEwayPayload(invoice: Sale, parties: ComplianceParties, distanceKm = 0) {
  validateInvoice(invoice);
  if (invoice.items.some((item) => item.hsnCode.startsWith("99")))
    throw AppError.validation("E-way bills require goods, not service items.");
  if (!Number.isInteger(distanceKm) || distanceKm < 1 || distanceKm > 4000)
    throw AppError.validation("Enter transport distance from 1 to 4000 km.");
  const vehicle = invoice.eway.vehicleNo.replace(/\s/g, "").toUpperCase();
  if (invoice.eway.part === "Part B" && !vehicle)
    throw AppError.validation("Enter a vehicle number for Part B.");
  if (!vehicle && !invoice.eway.transportGst)
    throw AppError.validation("Enter a transporter GSTIN/TRANSIN for Part A.");
  if (invoice.einvoice.irn)
    return {
      Irn: invoice.einvoice.irn,
      Distance: distanceKm,
      TransMode: "1",
      TransId: invoice.eway.transportGst || undefined,
      TransName: invoice.eway.transport || undefined,
      VehNo: vehicle || undefined,
      VehType: vehicle ? "R" : undefined
    };
  const seller = addressPayload(parties.seller.address, parties.seller.gstin.slice(0, 2));
  const gstin = invoice.customerGstin.trim().toUpperCase();
  if (gstin && !/^\d{2}[A-Z0-9]{13}$/.test(gstin))
    throw AppError.validation("Customer GSTIN is invalid.");
  const billing = addressPayload(parties.buyer, parties.buyer.stateCode || gstin.slice(0, 2));
  const shipping = addressPayload(
    parties.shipping,
    parties.shipping.stateCode || gstin.slice(0, 2)
  );
  return {
    supplyType: "O",
    subSupplyType: "1",
    docType: "INV",
    docNo: invoice.invoiceNumber,
    docDate: providerDate(invoice.issuedOn),
    fromGstin: parties.seller.gstin,
    fromTrdName: parties.seller.name,
    fromAddr1: seller.Addr1,
    fromAddr2: seller.Addr2,
    fromPlace: seller.Loc,
    fromPincode: seller.Pin,
    fromStateCode: Number(seller.Stcd),
    actFromStateCode: Number(seller.Stcd),
    toGstin: gstin || "URP",
    toTrdName: invoice.customerName,
    toAddr1: shipping.Addr1,
    toAddr2: shipping.Addr2,
    toPlace: shipping.Loc,
    toPincode: shipping.Pin,
    toStateCode: Number(billing.Stcd),
    actToStateCode: Number(shipping.Stcd),
    transactionType: invoice.billingAddressId === invoice.shippingAddressId ? 1 : 2,
    totalValue: invoice.subtotal,
    cgstValue: sum(invoice, "cgstAmount"),
    sgstValue: sum(invoice, "sgstAmount"),
    igstValue: sum(invoice, "igstAmount"),
    cessValue: 0,
    cessNonAdvolValue: 0,
    otherValue: invoice.roundOff,
    totInvValue: invoice.amount,
    transMode: "1",
    transDistance: String(distanceKm),
    transporterId: invoice.eway.transportGst,
    transporterName: invoice.eway.transport,
    vehicleNo: vehicle,
    vehicleType: vehicle ? "R" : "",
    itemList: invoice.items.map((item) => ({
      productName: item.description,
      hsnCode: Number(item.hsnCode),
      quantity: item.quantity,
      qtyUnit: unitCode(item.unit),
      taxableAmount: item.taxableAmount,
      cgstRate: invoice.taxType === "cgst-sgst" ? item.taxRate / 2 : 0,
      sgstRate: invoice.taxType === "cgst-sgst" ? item.taxRate / 2 : 0,
      igstRate: invoice.taxType === "igst" ? item.taxRate : 0,
      cessRate: 0,
      cessNonadvol: 0
    }))
  };
}

export function providerDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) throw AppError.validation("Invoice date must use YYYY-MM-DD.");
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function validateInvoice(invoice: Sale) {
  if (invoice.status !== "confirmed")
    throw AppError.validation("Confirm the invoice before generating compliance.");
  if (invoice.currencyCode.toUpperCase() !== "INR")
    throw AppError.validation(
      "WhiteBooks requires INR tax values. Foreign currency conversion is not configured."
    );
  if (!/^[A-Za-z0-9][A-Za-z0-9/-]{0,15}$/.test(invoice.invoiceNumber))
    throw AppError.validation(
      "Compliance invoice numbers must contain 1 to 16 letters, digits, slashes, or hyphens."
    );
  if (!invoice.items.length)
    throw AppError.validation("Add invoice items before generating compliance.");
  if (
    invoice.items.some(
      (item) =>
        !/^\d{4}(?:\d{2})?(?:\d{2})?$/.test(item.hsnCode) || !item.unit.trim() || item.quantity <= 0
    )
  )
    throw AppError.validation("Each item needs a valid HSN, unit, and positive quantity.");
}

function addressPayload(address: ComplianceAddress, state: string, exporting = false) {
  if (!address.addressLine1?.trim() || !address.cityName?.trim())
    throw AppError.validation("Company and customer addresses require an address line and city.");
  const pin = exporting ? 999999 : Number(address.pincodeName);
  if (!Number.isInteger(pin) || pin < 100000 || pin > 999999)
    throw AppError.validation("Company and customer addresses require a six-digit PIN code.");
  if (!/^\d{2}$/.test(state))
    throw AppError.validation(
      "A registered customer GSTIN is required to resolve the state for this transaction."
    );
  return {
    Addr1: address.addressLine1,
    Addr2: address.addressLine2 || undefined,
    Loc: address.cityName,
    Pin: pin,
    Stcd: state
  };
}

function sum(invoice: Sale, field: "cgstAmount" | "sgstAmount" | "igstAmount") {
  return Number(invoice.items.reduce((total, item) => total + item[field], 0).toFixed(2));
}

function unitCode(value: string) {
  const normalized = value.trim().toUpperCase();
  const names: Record<string, string> = { NOS: "NOS", KG: "KGS", METER: "MTR", LITRE: "LTR" };
  const unit = names[normalized] ?? normalized;
  if (!/^[A-Z]{3}$/.test(unit))
    throw AppError.validation(`Unit ${value} requires a valid GST unit code.`);
  return unit;
}
