import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import type {
  BillingVoucher,
  BillingVoucherBillAllocationPayload,
  BillingVoucherEInvoice,
  BillingVoucherEWayBill,
  BillingVoucherFinancialYear,
  BillingVoucherType,
} from "../../shared/index.js"

function toDateOnly(input: string) {
  return new Date(`${input}T00:00:00.000Z`)
}

function formatDateOnly(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}`
}

function pad(value: number, width = 4) {
  return String(value).padStart(width, "0")
}

export function resolveFinancialYear(
  date: string,
  config: ServerConfig
): Omit<BillingVoucherFinancialYear, "prefix" | "sequenceNumber"> {
  const targetDate = toDateOnly(date)
  const year = targetDate.getUTCFullYear()
  const startMonth = config.billing.compliance.financialYearStartMonth
  const startDay = config.billing.compliance.financialYearStartDay
  const fyStart = new Date(
    Date.UTC(
      year,
      startMonth - 1,
      startDay
    )
  )
  const startYear = targetDate >= fyStart ? year : year - 1
  const endYear = startYear + 1
  const nextFyStart = new Date(Date.UTC(endYear, startMonth - 1, startDay))
  const fyEnd = new Date(nextFyStart.getTime() - 24 * 60 * 60 * 1000)

  return {
    code: `FY${startYear}-${String(endYear).slice(-2)}`,
    label: `${startYear}-${String(endYear).slice(-2)}`,
    startDate: `${startYear}-${pad(startMonth, 2)}-${pad(startDay, 2)}`,
    endDate: formatDateOnly(fyEnd),
  }
}

export function getVoucherPrefix(type: BillingVoucherType) {
  switch (type) {
    case "payment":
      return "PAY"
    case "receipt":
      return "RCP"
    case "sales":
      return "SAL"
    case "purchase":
      return "PUR"
    case "contra":
      return "CON"
    case "journal":
      return "JRN"
  }
}

export function createVoucherNumber(
  type: BillingVoucherType,
  financialYear: BillingVoucherFinancialYear
) {
  return `${financialYear.prefix}-${financialYear.label}-${pad(financialYear.sequenceNumber, 3)}`
}

export function validateBillAllocations(
  type: BillingVoucherType,
  billAllocations: BillingVoucherBillAllocationPayload[],
  grossSettlementAmount: number
) {
  if (!["payment", "receipt"].includes(type) && billAllocations.length > 0) {
    throw new Error("Bill-wise adjustments are currently supported only for payment and receipt vouchers.")
  }

  const totalAllocated = Number(
    billAllocations.reduce((sum, allocation) => sum + allocation.amount, 0).toFixed(2)
  )

  if (billAllocations.length > 0 && totalAllocated !== Number(grossSettlementAmount.toFixed(2))) {
    throw new Error("Bill-wise allocation total must match the settlement amount.")
  }
}

function mockHash(value: string) {
  let hash = 0

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return hash.toString(16).padStart(8, "0").slice(0, 8).toUpperCase()
}

export async function generateEInvoiceRecord(
  voucher: BillingVoucher,
  config: ServerConfig
): Promise<BillingVoucherEInvoice> {
  if (!["sales"].includes(voucher.type) || voucher.gst === null) {
    return {
      status: "not_applicable",
      irn: null,
      ackNo: null,
      ackDate: null,
      qrCodePayload: null,
      signedInvoice: null,
      generatedAt: null,
      errorMessage: null,
    }
  }

  if (!config.billing.compliance.eInvoice.enabled) {
    return {
      status: "pending",
      irn: null,
      ackNo: null,
      ackDate: null,
      qrCodePayload: null,
      signedInvoice: null,
      generatedAt: null,
      errorMessage: "E-invoice integration is configured as disabled.",
    }
  }

  const timestamp = new Date().toISOString()
  const seed = `${voucher.id}:${voucher.voucherNumber}:${voucher.gst.invoiceAmount}`

  return {
    status: "generated",
    irn: `IRN${mockHash(seed)}${mockHash(`${seed}:irn`)}`,
    ackNo: `${Date.now()}`.slice(-10),
    ackDate: timestamp,
    qrCodePayload: `mock-einvoice:${voucher.voucherNumber}:${voucher.gst.invoiceAmount}`,
    signedInvoice:
      config.billing.compliance.eInvoice.mode === "mock"
        ? `SIGNED-INVOICE-${mockHash(`${seed}:signed`)}`
        : null,
    generatedAt: timestamp,
    errorMessage: null,
  }
}

export async function generateEWayBillRecord(
  voucher: BillingVoucher,
  config: ServerConfig,
  transport:
    | {
        distanceKm: number
        vehicleNumber: string
        transporterId: string | null
      }
    | null
): Promise<BillingVoucherEWayBill> {
  if (!["sales", "purchase"].includes(voucher.type) || voucher.gst === null) {
    return {
      status: "not_applicable",
      ewayBillNo: null,
      ewayBillDate: null,
      validUpto: null,
      distanceKm: null,
      vehicleNumber: null,
      transporterId: null,
      generatedAt: null,
      errorMessage: null,
    }
  }

  if (!transport) {
    return {
      status: "pending",
      ewayBillNo: null,
      ewayBillDate: null,
      validUpto: null,
      distanceKm: null,
      vehicleNumber: null,
      transporterId: null,
      generatedAt: null,
      errorMessage: "Transport details are required for e-way bill generation.",
    }
  }

  if (!config.billing.compliance.eWayBill.enabled) {
    return {
      status: "pending",
      ewayBillNo: null,
      ewayBillDate: null,
      validUpto: null,
      distanceKm: transport.distanceKm,
      vehicleNumber: transport.vehicleNumber,
      transporterId: transport.transporterId,
      generatedAt: null,
      errorMessage: "E-way bill integration is configured as disabled.",
    }
  }

  const generatedAt = new Date().toISOString()
  const validUntil = new Date(Date.now() + Math.max(1, Math.ceil(transport.distanceKm / 100)) * 24 * 60 * 60 * 1000)
    .toISOString()

  return {
    status: "generated",
    ewayBillNo: `EWB${mockHash(`${voucher.id}:${transport.vehicleNumber}:${transport.distanceKm}`)}`,
    ewayBillDate: generatedAt,
    validUpto: validUntil,
    distanceKm: transport.distanceKm,
    vehicleNumber: transport.vehicleNumber,
    transporterId: transport.transporterId,
    generatedAt,
    errorMessage: null,
  }
}
