import { z } from "zod"

export const billingVoucherTypeSchema = z.enum([
  "payment",
  "receipt",
  "sales",
  "credit_note",
  "purchase",
  "debit_note",
  "contra",
  "journal",
])

export const billingVoucherLifecycleStatusSchema = z.enum([
  "draft",
  "posted",
  "cancelled",
  "reversed",
])

export const billingVoucherReversePayloadSchema = z.object({
  reason: z.string().trim().min(3),
  date: z.string().trim().min(1).optional(),
})

export const billingEntrySideSchema = z.enum(["debit", "credit"])

export const billingLedgerSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  categoryId: z.string().trim().min(1),
  categoryName: z.string().trim().min(1),
  group: z.string().trim().min(1),
  nature: z.enum(["asset", "liability", "income", "expense"]),
  closingSide: billingEntrySideSchema,
  closingAmount: z.number().nonnegative(),
})

export const billingCategorySchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  nature: z.enum(["asset", "liability", "income", "expense"]).nullable().default(null),
  description: z.string().trim(),
  linkedLedgerCount: z.number().int().nonnegative(),
  deletedAt: z.string().trim().min(1).nullable().default(null),
})

export const billingLedgerUpsertPayloadSchema = z.object({
  name: z.string().trim().min(1),
  categoryId: z.string().trim().min(1),
  group: z.string().trim().min(1),
  nature: z.enum(["asset", "liability", "income", "expense"]),
  closingSide: billingEntrySideSchema,
  closingAmount: z.number().nonnegative(),
})

export const billingCategoryUpsertPayloadSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().default(""),
})

export const billingVoucherGroupSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim(),
  linkedVoucherTypeCount: z.number().int().nonnegative(),
  deletedAt: z.string().trim().min(1).nullable().default(null),
})

export const billingVoucherGroupUpsertPayloadSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().default(""),
})

export const billingVoucherMasterTypeSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  categoryId: z.string().trim().min(1),
  categoryName: z.string().trim().min(1),
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  voucherGroupId: z.string().trim().min(1),
  voucherGroupName: z.string().trim().min(1),
  postingType: billingVoucherTypeSchema,
  description: z.string().trim(),
  deletedAt: z.string().trim().min(1).nullable().default(null),
})

export const billingVoucherMasterTypeUpsertPayloadSchema = z.object({
  name: z.string().trim().min(1),
  categoryId: z.string().trim().min(1),
  ledgerId: z.string().trim().min(1),
  voucherGroupId: z.string().trim().min(1),
  description: z.string().trim().default(""),
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

export const billingSalesInvoiceItemSchema = z.object({
  id: z.string().trim().min(1),
  itemName: z.string().trim().min(1),
  description: z.string().trim(),
  hsnOrSac: z.string().trim().min(1),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1),
  rate: z.number().positive(),
  amount: z.number().positive(),
})

export const billingSalesInvoiceSchema = z.object({
  voucherTypeId: z.string().trim().min(1),
  voucherTypeName: z.string().trim().min(1),
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  customerLedgerId: z.string().trim().min(1),
  customerLedgerName: z.string().trim().min(1),
  billToName: z.string().trim().min(1),
  billToAddress: z.string().trim().min(1),
  shipToName: z.string().trim().nullable(),
  shipToAddress: z.string().trim().nullable(),
  dueDate: z.string().trim().nullable(),
  referenceNumber: z.string().trim().nullable(),
  supplyType: billingGstSupplyTypeSchema,
  placeOfSupply: z.string().trim().min(1),
  partyGstin: z.string().trim().nullable(),
  taxRate: z.number().positive().max(100),
  subtotal: z.number().positive(),
  totalQuantity: z.number().positive(),
  taxAmount: z.number().nonnegative(),
  grandTotal: z.number().positive(),
  items: z.array(billingSalesInvoiceItemSchema).min(1),
})

export const billingVoucherSourceDocumentSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: billingVoucherTypeSchema,
})

export const billingVoucherSchema = z.object({
  id: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  status: billingVoucherLifecycleStatusSchema.default("posted"),
  reversalOfVoucherId: z.string().trim().min(1).nullable().default(null),
  reversalOfVoucherNumber: z.string().trim().min(1).nullable().default(null),
  reversedByVoucherId: z.string().trim().min(1).nullable().default(null),
  reversedByVoucherNumber: z.string().trim().min(1).nullable().default(null),
  reversedAt: z.string().trim().min(1).nullable().default(null),
  reversalReason: z.string().trim().min(1).nullable().default(null),
  sourceDocument: billingVoucherSourceDocumentSchema.nullable().default(null),
  type: billingVoucherTypeSchema,
  date: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  narration: z.string().trim(),
  lines: z.array(billingVoucherLineSchema).min(2),
  gst: billingVoucherGstSchema.nullable(),
  sales: billingSalesInvoiceSchema.nullable().default(null),
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

export const billingSalesInvoiceItemPayloadSchema = z.object({
  itemName: z.string().trim().min(1),
  description: z.string().trim().default(""),
  hsnOrSac: z.string().trim().min(1),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1),
  rate: z.number().positive(),
})

export const billingSalesInvoicePayloadSchema = z.object({
  voucherTypeId: z.string().trim().min(1),
  customerLedgerId: z.string().trim().min(1),
  billToName: z.string().trim().min(1),
  billToAddress: z.string().trim().min(1),
  shipToName: z.string().trim().nullable().default(null),
  shipToAddress: z.string().trim().nullable().default(null),
  dueDate: z.string().trim().nullable().default(null),
  referenceNumber: z.string().trim().nullable().default(null),
  supplyType: billingGstSupplyTypeSchema,
  placeOfSupply: z.string().trim().min(1),
  partyGstin: z.string().trim().nullable().default(null),
  taxRate: z.number().positive().max(100),
  items: z.array(billingSalesInvoiceItemPayloadSchema).min(1),
})

export const billingVoucherUpsertPayloadSchema = z.object({
  voucherNumber: z.string().trim().default(""),
  status: billingVoucherLifecycleStatusSchema.default("posted"),
  type: billingVoucherTypeSchema,
  sourceVoucherId: z.string().trim().min(1).nullable().default(null),
  date: z.string().trim().min(1),
  counterparty: z.string().trim().default(""),
  narration: z.string().trim(),
  lines: z.array(billingVoucherUpsertLinePayloadSchema).default([]),
  gst: billingVoucherGstPayloadSchema.nullable().default(null),
  billAllocations: z.array(billingVoucherBillAllocationPayloadSchema).default([]),
  transport: billingVoucherTransportPayloadSchema.nullable().default(null),
  sales: billingSalesInvoicePayloadSchema.nullable().default(null),
  generateEInvoice: z.boolean().default(false),
  generateEWayBill: z.boolean().default(false),
})

export const billingLedgerListResponseSchema = z.object({
  items: z.array(billingLedgerSchema),
})

export const billingCategoryListResponseSchema = z.object({
  items: z.array(billingCategorySchema),
})

export const billingVoucherGroupListResponseSchema = z.object({
  items: z.array(billingVoucherGroupSchema),
})

export const billingVoucherMasterTypeListResponseSchema = z.object({
  items: z.array(billingVoucherMasterTypeSchema),
})

export const billingVoucherListResponseSchema = z.object({
  items: z.array(billingVoucherSchema),
})

export const billingVoucherResponseSchema = z.object({
  item: billingVoucherSchema,
})

export const billingVoucherReverseResponseSchema = z.object({
  item: billingVoucherSchema,
  reversalItem: billingVoucherSchema,
})

export const billingVoucherHeaderSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  status: billingVoucherLifecycleStatusSchema,
  type: billingVoucherTypeSchema,
  date: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  narration: z.string().trim(),
  financialYearCode: z.string().trim().min(1),
  financialYearLabel: z.string().trim().min(1),
  financialYearStartDate: z.string().trim().min(1),
  financialYearEndDate: z.string().trim().min(1),
  financialYearSequenceNumber: z.number().int().positive(),
  financialYearPrefix: z.string().trim().min(1),
  totalDebit: z.number().nonnegative(),
  totalCredit: z.number().nonnegative(),
  lineCount: z.number().int().nonnegative(),
  billAllocationCount: z.number().int().nonnegative(),
  hasGst: z.boolean(),
  hasSalesInvoice: z.boolean(),
  reversalOfVoucherId: z.string().trim().min(1).nullable(),
  reversalOfVoucherNumber: z.string().trim().min(1).nullable(),
  reversedByVoucherId: z.string().trim().min(1).nullable(),
  reversedByVoucherNumber: z.string().trim().min(1).nullable(),
  reversedAt: z.string().trim().min(1).nullable(),
  reversalReason: z.string().trim().min(1).nullable(),
  sourceDocument: billingVoucherSourceDocumentSchema.nullable(),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  createdByUserId: z.string().trim().nullable(),
})

export const billingVoucherHeaderListResponseSchema = z.object({
  items: z.array(billingVoucherHeaderSchema),
})

export const billingVoucherLineRecordSchema = z.object({
  lineId: z.string().trim().min(1),
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherStatus: billingVoucherLifecycleStatusSchema,
  voucherType: billingVoucherTypeSchema,
  voucherDate: z.string().trim().min(1),
  lineOrder: z.number().int().positive(),
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  side: billingEntrySideSchema,
  amount: z.number().positive(),
  note: z.string().trim(),
  counterparty: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
})

export const billingVoucherLineRecordListResponseSchema = z.object({
  items: z.array(billingVoucherLineRecordSchema),
})

export const billingLedgerEntrySchema = z.object({
  entryId: z.string().trim().min(1),
  voucherId: z.string().trim().min(1),
  voucherLineId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: billingVoucherTypeSchema,
  voucherStatus: billingVoucherLifecycleStatusSchema,
  voucherDate: z.string().trim().min(1),
  entryOrder: z.number().int().positive(),
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  side: billingEntrySideSchema,
  amount: z.number().positive(),
  counterparty: z.string().trim().min(1),
  narration: z.string().trim(),
  reversalOfVoucherId: z.string().trim().min(1).nullable(),
  reversalOfVoucherNumber: z.string().trim().min(1).nullable(),
  postedAt: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
})

export const billingLedgerEntryListResponseSchema = z.object({
  items: z.array(billingLedgerEntrySchema),
})

export const billingReportSourceReferenceSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  entryIds: z.array(z.string().trim().min(1)).min(1),
})

export const billingLedgerResponseSchema = z.object({
  item: billingLedgerSchema,
})

export const billingCategoryResponseSchema = z.object({
  item: billingCategorySchema,
})

export const billingVoucherGroupResponseSchema = z.object({
  item: billingVoucherGroupSchema,
})

export const billingVoucherMasterTypeResponseSchema = z.object({
  item: billingVoucherMasterTypeSchema,
})

export const billingTrialBalanceItemSchema = z.object({
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  group: z.string().trim().min(1),
  nature: z.enum(["asset", "liability", "income", "expense"]),
  openingSide: billingEntrySideSchema,
  openingAmount: z.number().nonnegative(),
  debitAmount: z.number().nonnegative(),
  creditAmount: z.number().nonnegative(),
  closingSide: billingEntrySideSchema,
  closingAmount: z.number().nonnegative(),
  sourceReferences: z.array(billingReportSourceReferenceSchema),
})

export const billingTrialBalanceSchema = z.object({
  items: z.array(billingTrialBalanceItemSchema),
  debitTotal: z.number().nonnegative(),
  creditTotal: z.number().nonnegative(),
})

export const billingProfitAndLossEntrySchema = z.object({
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  group: z.string().trim().min(1),
  amount: z.number().nonnegative(),
  sourceReferences: z.array(billingReportSourceReferenceSchema),
})

export const billingProfitAndLossSchema = z.object({
  incomeItems: z.array(billingProfitAndLossEntrySchema),
  expenseItems: z.array(billingProfitAndLossEntrySchema),
  totalIncome: z.number().nonnegative(),
  totalExpense: z.number().nonnegative(),
  netProfit: z.number().nonnegative(),
  netLoss: z.number().nonnegative(),
})

export const billingBalanceSheetEntrySchema = z.object({
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  group: z.string().trim().min(1),
  amount: z.number().nonnegative(),
  sourceReferences: z.array(billingReportSourceReferenceSchema),
})

export const billingBalanceSheetSchema = z.object({
  assetItems: z.array(billingBalanceSheetEntrySchema),
  liabilityItems: z.array(billingBalanceSheetEntrySchema),
  totalAssets: z.number().nonnegative(),
  totalLiabilities: z.number().nonnegative(),
  balanceGap: z.number().nonnegative(),
})

export const billingOutstandingItemSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: z.enum(["sales", "purchase"]),
  date: z.string().trim().min(1),
  dueDate: z.string().trim().min(1).nullable().default(null),
  overdueDays: z.number().int().nonnegative(),
  counterparty: z.string().trim().min(1),
  originalAmount: z.number().positive(),
  settledAmount: z.number().nonnegative(),
  outstandingAmount: z.number().nonnegative(),
})

export const billingOutstandingSummarySchema = z.object({
  asOfDate: z.string().trim().min(1),
  receivableTotal: z.number().nonnegative(),
  payableTotal: z.number().nonnegative(),
  items: z.array(billingOutstandingItemSchema),
})

export const billingAgingBucketSchema = z.object({
  bucketKey: z.enum(["current", "1_30", "31_60", "61_90", "91_plus"]),
  label: z.string().trim().min(1),
  amount: z.number().nonnegative(),
})

export const billingAgingItemSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: z.enum(["sales", "purchase"]),
  counterparty: z.string().trim().min(1),
  date: z.string().trim().min(1),
  dueDate: z.string().trim().min(1).nullable(),
  overdueDays: z.number().int().nonnegative(),
  outstandingAmount: z.number().nonnegative(),
  bucketKey: billingAgingBucketSchema.shape.bucketKey,
  bucketLabel: z.string().trim().min(1),
})

export const billingAgingReportSchema = z.object({
  asOfDate: z.string().trim().min(1),
  totalAmount: z.number().nonnegative(),
  buckets: z.array(billingAgingBucketSchema),
  items: z.array(billingAgingItemSchema),
})

export const billingSettlementFollowUpItemSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: z.enum(["sales", "purchase"]),
  counterparty: z.string().trim().min(1),
  dueDate: z.string().trim().min(1).nullable(),
  overdueDays: z.number().int().nonnegative(),
  outstandingAmount: z.number().nonnegative(),
  priority: z.enum(["normal", "medium", "high"]),
  recommendedAction: z.string().trim().min(1),
  actionRoute: z.string().trim().min(1),
})

export const billingSettlementFollowUpSchema = z.object({
  items: z.array(billingSettlementFollowUpItemSchema),
})

export const billingSettlementExceptionItemSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: billingVoucherTypeSchema,
  counterparty: z.string().trim().min(1),
  category: z.enum(["overpayment", "advance", "on_account"]),
  amount: z.number().positive(),
  referenceVoucherNumber: z.string().trim().min(1).nullable(),
  note: z.string().trim().min(1),
})

export const billingSettlementExceptionSummarySchema = z.object({
  advanceTotal: z.number().nonnegative(),
  onAccountTotal: z.number().nonnegative(),
  overpaymentTotal: z.number().nonnegative(),
  items: z.array(billingSettlementExceptionItemSchema),
})

export const billingPartySettlementSummaryItemSchema = z.object({
  counterparty: z.string().trim().min(1),
  receiptCount: z.number().int().nonnegative(),
  paymentCount: z.number().int().nonnegative(),
  receiptAmount: z.number().nonnegative(),
  paymentAmount: z.number().nonnegative(),
  allocatedReceiptAmount: z.number().nonnegative(),
  allocatedPaymentAmount: z.number().nonnegative(),
  unallocatedReceiptAmount: z.number().nonnegative(),
  unallocatedPaymentAmount: z.number().nonnegative(),
})

export const billingPartySettlementSummarySchema = z.object({
  items: z.array(billingPartySettlementSummaryItemSchema),
})

export const billingGeneralLedgerEntrySchema = z.object({
  entryId: z.string().trim().min(1),
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: billingVoucherTypeSchema,
  voucherDate: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  narration: z.string().trim(),
  side: billingEntrySideSchema,
  amount: z.number().positive(),
  runningSide: billingEntrySideSchema,
  runningAmount: z.number().nonnegative(),
})

export const billingGeneralLedgerItemSchema = z.object({
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  group: z.string().trim().min(1),
  openingSide: billingEntrySideSchema,
  openingAmount: z.number().nonnegative(),
  debitTotal: z.number().nonnegative(),
  creditTotal: z.number().nonnegative(),
  closingSide: billingEntrySideSchema,
  closingAmount: z.number().nonnegative(),
  entries: z.array(billingGeneralLedgerEntrySchema),
})

export const billingGeneralLedgerSchema = z.object({
  items: z.array(billingGeneralLedgerItemSchema),
})

export const billingCustomerStatementEntrySchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: z.enum(["sales", "credit_note", "receipt"]),
  date: z.string().trim().min(1),
  narration: z.string().trim(),
  referenceVoucherNumber: z.string().trim().min(1).nullable(),
  debitAmount: z.number().nonnegative(),
  creditAmount: z.number().nonnegative(),
  runningSide: billingEntrySideSchema,
  runningAmount: z.number().nonnegative(),
})

export const billingCustomerStatementItemSchema = z.object({
  customerId: z.string().trim().min(1),
  customerName: z.string().trim().min(1),
  openingSide: billingEntrySideSchema,
  openingAmount: z.number().nonnegative(),
  debitTotal: z.number().nonnegative(),
  creditTotal: z.number().nonnegative(),
  closingSide: billingEntrySideSchema,
  closingAmount: z.number().nonnegative(),
  entries: z.array(billingCustomerStatementEntrySchema),
})

export const billingCustomerStatementSchema = z.object({
  items: z.array(billingCustomerStatementItemSchema),
})

export const billingSupplierStatementEntrySchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: z.enum(["purchase", "debit_note", "payment"]),
  date: z.string().trim().min(1),
  narration: z.string().trim(),
  referenceVoucherNumber: z.string().trim().min(1).nullable(),
  debitAmount: z.number().nonnegative(),
  creditAmount: z.number().nonnegative(),
  runningSide: billingEntrySideSchema,
  runningAmount: z.number().nonnegative(),
})

export const billingSupplierStatementItemSchema = z.object({
  supplierId: z.string().trim().min(1),
  supplierName: z.string().trim().min(1),
  openingSide: billingEntrySideSchema,
  openingAmount: z.number().nonnegative(),
  debitTotal: z.number().nonnegative(),
  creditTotal: z.number().nonnegative(),
  closingSide: billingEntrySideSchema,
  closingAmount: z.number().nonnegative(),
  entries: z.array(billingSupplierStatementEntrySchema),
})

export const billingSupplierStatementSchema = z.object({
  items: z.array(billingSupplierStatementItemSchema),
})

export const billingAccountingReportsSchema = z.object({
  trialBalance: billingTrialBalanceSchema,
  profitAndLoss: billingProfitAndLossSchema,
  balanceSheet: billingBalanceSheetSchema,
  outstanding: billingOutstandingSummarySchema,
  receivableAging: billingAgingReportSchema,
  payableAging: billingAgingReportSchema,
  settlementFollowUp: billingSettlementFollowUpSchema,
  settlementExceptions: billingSettlementExceptionSummarySchema,
  partySettlementSummary: billingPartySettlementSummarySchema,
  generalLedger: billingGeneralLedgerSchema,
  customerStatement: billingCustomerStatementSchema,
  supplierStatement: billingSupplierStatementSchema,
})

export const billingAccountingReportsResponseSchema = z.object({
  item: billingAccountingReportsSchema,
})

export type BillingVoucherType = z.infer<typeof billingVoucherTypeSchema>
export type BillingVoucherLifecycleStatus = z.infer<
  typeof billingVoucherLifecycleStatusSchema
>
export type BillingVoucherReversePayload = z.infer<
  typeof billingVoucherReversePayloadSchema
>
export type BillingEntrySide = z.infer<typeof billingEntrySideSchema>
export type BillingLedger = z.infer<typeof billingLedgerSchema>
export type BillingCategory = z.infer<typeof billingCategorySchema>
export type BillingVoucherGroup = z.infer<typeof billingVoucherGroupSchema>
export type BillingVoucherMasterType = z.infer<typeof billingVoucherMasterTypeSchema>
export type BillingLedgerUpsertPayload = z.infer<
  typeof billingLedgerUpsertPayloadSchema
>
export type BillingCategoryUpsertPayload = z.infer<
  typeof billingCategoryUpsertPayloadSchema
>
export type BillingVoucherGroupUpsertPayload = z.infer<
  typeof billingVoucherGroupUpsertPayloadSchema
>
export type BillingVoucherMasterTypeUpsertPayload = z.infer<
  typeof billingVoucherMasterTypeUpsertPayloadSchema
>
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
export type BillingSalesInvoiceItem = z.infer<typeof billingSalesInvoiceItemSchema>
export type BillingSalesInvoice = z.infer<typeof billingSalesInvoiceSchema>
export type BillingVoucher = z.infer<typeof billingVoucherSchema>
export type BillingVoucherHeader = z.infer<typeof billingVoucherHeaderSchema>
export type BillingVoucherLineRecord = z.infer<typeof billingVoucherLineRecordSchema>
export type BillingLedgerEntry = z.infer<typeof billingLedgerEntrySchema>
export type BillingVoucherUpsertPayload = z.infer<
  typeof billingVoucherUpsertPayloadSchema
>
export type BillingSalesInvoicePayload = z.infer<
  typeof billingSalesInvoicePayloadSchema
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
export type BillingCategoryListResponse = z.infer<
  typeof billingCategoryListResponseSchema
>
export type BillingVoucherGroupListResponse = z.infer<
  typeof billingVoucherGroupListResponseSchema
>
export type BillingVoucherMasterTypeListResponse = z.infer<
  typeof billingVoucherMasterTypeListResponseSchema
>
export type BillingLedgerResponse = z.infer<typeof billingLedgerResponseSchema>
export type BillingCategoryResponse = z.infer<
  typeof billingCategoryResponseSchema
>
export type BillingVoucherGroupResponse = z.infer<
  typeof billingVoucherGroupResponseSchema
>
export type BillingVoucherMasterTypeResponse = z.infer<
  typeof billingVoucherMasterTypeResponseSchema
>
export type BillingVoucherListResponse = z.infer<
  typeof billingVoucherListResponseSchema
>
export type BillingVoucherResponse = z.infer<typeof billingVoucherResponseSchema>
export type BillingVoucherReverseResponse = z.infer<
  typeof billingVoucherReverseResponseSchema
>
export type BillingTrialBalanceItem = z.infer<typeof billingTrialBalanceItemSchema>
export type BillingTrialBalance = z.infer<typeof billingTrialBalanceSchema>
export type BillingProfitAndLossEntry = z.infer<
  typeof billingProfitAndLossEntrySchema
>
export type BillingProfitAndLoss = z.infer<typeof billingProfitAndLossSchema>
export type BillingBalanceSheetEntry = z.infer<
  typeof billingBalanceSheetEntrySchema
>
export type BillingBalanceSheet = z.infer<typeof billingBalanceSheetSchema>
export type BillingOutstandingItem = z.infer<typeof billingOutstandingItemSchema>
export type BillingOutstandingSummary = z.infer<
  typeof billingOutstandingSummarySchema
>
export type BillingAgingBucket = z.infer<typeof billingAgingBucketSchema>
export type BillingAgingItem = z.infer<typeof billingAgingItemSchema>
export type BillingAgingReport = z.infer<typeof billingAgingReportSchema>
export type BillingSettlementFollowUpItem = z.infer<
  typeof billingSettlementFollowUpItemSchema
>
export type BillingSettlementFollowUp = z.infer<
  typeof billingSettlementFollowUpSchema
>
export type BillingSettlementExceptionItem = z.infer<
  typeof billingSettlementExceptionItemSchema
>
export type BillingSettlementExceptionSummary = z.infer<
  typeof billingSettlementExceptionSummarySchema
>
export type BillingPartySettlementSummaryItem = z.infer<
  typeof billingPartySettlementSummaryItemSchema
>
export type BillingPartySettlementSummary = z.infer<
  typeof billingPartySettlementSummarySchema
>
export type BillingCustomerStatementEntry = z.infer<
  typeof billingCustomerStatementEntrySchema
>
export type BillingCustomerStatementItem = z.infer<
  typeof billingCustomerStatementItemSchema
>
export type BillingCustomerStatement = z.infer<
  typeof billingCustomerStatementSchema
>
export type BillingSupplierStatementEntry = z.infer<
  typeof billingSupplierStatementEntrySchema
>
export type BillingSupplierStatementItem = z.infer<
  typeof billingSupplierStatementItemSchema
>
export type BillingSupplierStatement = z.infer<
  typeof billingSupplierStatementSchema
>
export type BillingAccountingReports = z.infer<
  typeof billingAccountingReportsSchema
>
export type BillingAccountingReportsResponse = z.infer<
  typeof billingAccountingReportsResponseSchema
>
