import { z } from "zod"

export const billingVoucherTypeSchema = z.enum([
  "payment",
  "receipt",
  "sales",
  "purchase",
  "contra",
  "journal",
])

export const billingEntrySideSchema = z.enum(["debit", "credit"])

export const billingLedgerSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  group: z.string().trim().min(1),
  nature: z.enum(["asset", "liability", "income", "expense"]),
  closingSide: billingEntrySideSchema,
  closingAmount: z.number().nonnegative(),
})

export const billingVoucherLineSchema = z.object({
  id: z.string().trim().min(1),
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  side: billingEntrySideSchema,
  amount: z.number().positive(),
  note: z.string().trim(),
})

export const billingGstSupplyTypeSchema = z.enum(["intra", "inter"])
export const billingGstDirectionSchema = z.enum(["input", "output"])
export const billingBillReferenceTypeSchema = z.enum([
  "new_ref",
  "against_ref",
  "on_account",
])
export const billingIntegrationStatusSchema = z.enum([
  "not_applicable",
  "pending",
  "generated",
  "failed",
])

export const billingVoucherGstSchema = z.object({
  supplyType: billingGstSupplyTypeSchema,
  taxDirection: billingGstDirectionSchema,
  placeOfSupply: z.string().trim().min(1),
  partyGstin: z.string().trim().nullable(),
  hsnOrSac: z.string().trim().min(1),
  taxableAmount: z.number().positive(),
  taxRate: z.number().positive().max(100),
  taxableLedgerId: z.string().trim().min(1),
  taxableLedgerName: z.string().trim().min(1),
  partyLedgerId: z.string().trim().min(1),
  partyLedgerName: z.string().trim().min(1),
  cgstAmount: z.number().nonnegative(),
  sgstAmount: z.number().nonnegative(),
  igstAmount: z.number().nonnegative(),
  totalTaxAmount: z.number().nonnegative(),
  invoiceAmount: z.number().positive(),
})

export const billingVoucherBillAllocationSchema = z.object({
  id: z.string().trim().min(1),
  referenceType: billingBillReferenceTypeSchema,
  referenceNumber: z.string().trim().min(1),
  referenceDate: z.string().trim().min(1).nullable(),
  dueDate: z.string().trim().min(1).nullable(),
  amount: z.number().positive(),
  note: z.string().trim(),
})

export const billingVoucherFinancialYearSchema = z.object({
  code: z.string().trim().min(1),
  label: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  sequenceNumber: z.number().int().positive(),
  prefix: z.string().trim().min(1),
})

export const billingVoucherEInvoiceSchema = z.object({
  status: billingIntegrationStatusSchema,
  irn: z.string().trim().nullable(),
  ackNo: z.string().trim().nullable(),
  ackDate: z.string().trim().nullable(),
  qrCodePayload: z.string().trim().nullable(),
  signedInvoice: z.string().trim().nullable(),
  generatedAt: z.string().trim().nullable(),
  errorMessage: z.string().trim().nullable(),
})

export const billingVoucherEWayBillSchema = z.object({
  status: billingIntegrationStatusSchema,
  ewayBillNo: z.string().trim().nullable(),
  ewayBillDate: z.string().trim().nullable(),
  validUpto: z.string().trim().nullable(),
  distanceKm: z.number().int().nonnegative().nullable(),
  vehicleNumber: z.string().trim().nullable(),
  transporterId: z.string().trim().nullable(),
  generatedAt: z.string().trim().nullable(),
  errorMessage: z.string().trim().nullable(),
})

export const billingVoucherSchema = z.object({
  id: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  type: billingVoucherTypeSchema,
  date: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  narration: z.string().trim(),
  lines: z.array(billingVoucherLineSchema).min(2),
  gst: billingVoucherGstSchema.nullable(),
  financialYear: billingVoucherFinancialYearSchema,
  billAllocations: z.array(billingVoucherBillAllocationSchema),
  eInvoice: billingVoucherEInvoiceSchema,
  eWayBill: billingVoucherEWayBillSchema,
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  createdByUserId: z.string().trim().nullable(),
})

export const billingVoucherUpsertLinePayloadSchema = z.object({
  ledgerId: z.string().trim().min(1),
  side: billingEntrySideSchema,
  amount: z.number().positive(),
  note: z.string().trim(),
})

export const billingVoucherGstPayloadSchema = z.object({
  supplyType: billingGstSupplyTypeSchema,
  placeOfSupply: z.string().trim().min(1),
  partyGstin: z.string().trim().nullable(),
  hsnOrSac: z.string().trim().min(1),
  taxableAmount: z.number().positive(),
  taxRate: z.number().positive().max(100),
  taxableLedgerId: z.string().trim().min(1),
  partyLedgerId: z.string().trim().min(1),
})

export const billingVoucherBillAllocationPayloadSchema = z.object({
  referenceType: billingBillReferenceTypeSchema,
  referenceNumber: z.string().trim().min(1),
  referenceDate: z.string().trim().nullable().default(null),
  dueDate: z.string().trim().nullable().default(null),
  amount: z.number().positive(),
  note: z.string().trim().default(""),
})

export const billingVoucherTransportPayloadSchema = z.object({
  distanceKm: z.number().int().positive(),
  vehicleNumber: z.string().trim().min(1),
  transporterId: z.string().trim().min(1).nullable().default(null),
})

export const billingVoucherUpsertPayloadSchema = z.object({
  voucherNumber: z.string().trim().default(""),
  type: billingVoucherTypeSchema,
  date: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  narration: z.string().trim(),
  lines: z.array(billingVoucherUpsertLinePayloadSchema).default([]),
  gst: billingVoucherGstPayloadSchema.nullable().default(null),
  billAllocations: z.array(billingVoucherBillAllocationPayloadSchema).default([]),
  transport: billingVoucherTransportPayloadSchema.nullable().default(null),
  generateEInvoice: z.boolean().default(false),
  generateEWayBill: z.boolean().default(false),
})

export const billingLedgerListResponseSchema = z.object({
  items: z.array(billingLedgerSchema),
})

export const billingVoucherListResponseSchema = z.object({
  items: z.array(billingVoucherSchema),
})

export const billingVoucherResponseSchema = z.object({
  item: billingVoucherSchema,
})

export type BillingVoucherType = z.infer<typeof billingVoucherTypeSchema>
export type BillingEntrySide = z.infer<typeof billingEntrySideSchema>
export type BillingLedger = z.infer<typeof billingLedgerSchema>
export type BillingVoucherLine = z.infer<typeof billingVoucherLineSchema>
export type BillingVoucherGst = z.infer<typeof billingVoucherGstSchema>
export type BillingVoucherBillAllocation = z.infer<
  typeof billingVoucherBillAllocationSchema
>
export type BillingVoucherFinancialYear = z.infer<
  typeof billingVoucherFinancialYearSchema
>
export type BillingVoucherEInvoice = z.infer<typeof billingVoucherEInvoiceSchema>
export type BillingVoucherEWayBill = z.infer<typeof billingVoucherEWayBillSchema>
export type BillingVoucher = z.infer<typeof billingVoucherSchema>
export type BillingVoucherUpsertPayload = z.infer<
  typeof billingVoucherUpsertPayloadSchema
>
export type BillingVoucherGstPayload = z.infer<
  typeof billingVoucherGstPayloadSchema
>
export type BillingVoucherBillAllocationPayload = z.infer<
  typeof billingVoucherBillAllocationPayloadSchema
>
export type BillingLedgerListResponse = z.infer<
  typeof billingLedgerListResponseSchema
>
export type BillingVoucherListResponse = z.infer<
  typeof billingVoucherListResponseSchema
>
export type BillingVoucherResponse = z.infer<typeof billingVoucherResponseSchema>
