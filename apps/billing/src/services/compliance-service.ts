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

function isValidDateOnly(value: string | undefined) {
  if (!value) {
    return false
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function assertBillingOperationDateAllowed(
  date: string,
  config: ServerConfig,
  operationLabel: string
) {
  const blockedDates = [
    {
      value: config.billing.compliance.lockDate,
      label: "billing lock date",
    },
    {
      value: config.billing.compliance.periodClosedThrough,
      label: "closed-through date",
    },
  ].filter((entry) => isValidDateOnly(entry.value))

  for (const entry of blockedDates) {
    if (date <= (entry.value as string)) {
      throw new Error(
        `${operationLabel} date ${date} is blocked by the ${entry.label} ${(entry.value as string)}.`
      )
    }
  }
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
    case "sales_return":
      return "SRT"
    case "credit_note":
      return "CRN"
    case "purchase":
      return "PUR"
    case "purchase_return":
      return "PRT"
    case "debit_note":
      return "DBN"
    case "stock_adjustment":
      return "STA"
    case "landed_cost":
      return "LCT"
    case "contra":
      return "CON"
    case "journal":
      return "JRN"
  }
}

export function getConfiguredVoucherPrefix(
  type: BillingVoucherType,
  config: ServerConfig
) {
  return (
    config.billing.compliance.documentNumbering.prefixes[type] ||
    getVoucherPrefix(type)
  )
}

export function createVoucherNumber(
  _type: BillingVoucherType,
  financialYear: BillingVoucherFinancialYear,
  prefixOverride?: string
) {
  return `${prefixOverride ?? financialYear.prefix}-${financialYear.label}-${pad(financialYear.sequenceNumber, 3)}`
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

export async function generateEInvoiceRecord(
  voucher: BillingVoucher,
  config: ServerConfig
): Promise<BillingVoucherEInvoice> {
  if (
    !["sales", "sales_return", "credit_note", "debit_note"].includes(voucher.type) ||
    voucher.gst === null
  ) {
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

  if (config.billing.compliance.eInvoice.mode === "manual") {
    return {
      status: "pending",
      irn: null,
      ackNo: null,
      ackDate: null,
      qrCodePayload: null,
      signedInvoice: null,
      generatedAt: null,
      errorMessage: "Manual compliance mode is enabled. Capture IRN and acknowledgement details outside the system.",
    }
  }

  return {
    status: "pending",
    irn: null,
    ackNo: null,
    ackDate: null,
    qrCodePayload: null,
    signedInvoice: null,
    generatedAt: null,
    errorMessage: "Live e-invoice mode is configured, but provider submission is not implemented in this workspace yet.",
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
  if (
    !["sales", "purchase", "sales_return", "purchase_return", "credit_note", "debit_note"].includes(voucher.type) ||
    voucher.gst === null
  ) {
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

  if (config.billing.compliance.eWayBill.mode === "manual") {
    return {
      status: "pending",
      ewayBillNo: null,
      ewayBillDate: null,
      validUpto: null,
      distanceKm: transport.distanceKm,
      vehicleNumber: transport.vehicleNumber,
      transporterId: transport.transporterId,
      generatedAt: null,
      errorMessage: "Manual compliance mode is enabled. Capture e-way bill details outside the system.",
    }
  }

  return {
    status: "pending",
    ewayBillNo: null,
    ewayBillDate: null,
    validUpto: null,
    distanceKm: transport.distanceKm,
    vehicleNumber: transport.vehicleNumber,
    transporterId: transport.transporterId,
    generatedAt: null,
    errorMessage: "Live e-way bill mode is configured, but provider submission is not implemented in this workspace yet.",
  }
}
