import { z } from "zod"

export const billingVoucherTypeSchema = z.enum([
  "payment",
  "receipt",
  "sales",
  "sales_return",
  "credit_note",
  "purchase",
  "purchase_return",
  "debit_note",
  "stock_adjustment",
  "landed_cost",
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

export const billingBankReconciliationStatusSchema = z.enum([
  "not_applicable",
  "pending",
  "matched",
  "mismatch",
])

export const billingVoucherReviewStatusSchema = z.enum([
  "not_required",
  "pending_review",
  "approved",
  "rejected",
])
export const billingVoucherApprovalPolicySchema = z.enum([
  "none",
  "threshold_review",
  "maker_checker",
])

export const billingVoucherDocumentFormatSchema = z.enum(["print", "csv", "json"])

export const billingVoucherBankReconciliationSchema = z.object({
  status: billingBankReconciliationStatusSchema,
  clearedDate: z.string().trim().min(1).nullable().default(null),
  statementReference: z.string().trim().min(1).nullable().default(null),
  statementAmount: z.number().positive().nullable().default(null),
  mismatchAmount: z.number().nonnegative().nullable().default(null),
  note: z.string().trim().default(""),
}).default({
  status: "not_applicable",
  clearedDate: null,
  statementReference: null,
  statementAmount: null,
  mismatchAmount: null,
  note: "",
})

export const billingVoucherBankReconciliationPayloadSchema = z.object({
  status: z.enum(["pending", "matched", "mismatch"]),
  clearedDate: z.string().trim().nullable().default(null),
  statementReference: z.string().trim().nullable().default(null),
  statementAmount: z.number().positive().nullable().default(null),
  note: z.string().trim().default(""),
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
  productId: z.string().trim().min(1).nullable().default(null),
  warehouseId: z.string().trim().min(1).nullable().default(null),
  itemName: z.string().trim().min(1),
  description: z.string().trim(),
  hsnOrSac: z.string().trim().min(1),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1),
  rate: z.number().positive(),
  amount: z.number().positive(),
})

export const billingVoucherStockItemSchema = z.object({
  id: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  warehouseName: z.string().trim().min(1),
  quantity: z.number().finite(),
  unit: z.string().trim().min(1),
  unitCost: z.number().nonnegative(),
  landedCostAmount: z.number().nonnegative(),
  totalCost: z.number(),
  note: z.string().trim(),
})

export const billingVoucherStockSchema = z.object({
  items: z.array(billingVoucherStockItemSchema).min(1),
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

export const billingVoucherAccountingDimensionsSchema = z.object({
  branch: z.string().trim().min(1).nullable().default(null),
  project: z.string().trim().min(1).nullable().default(null),
  costCenter: z.string().trim().min(1).nullable().default(null),
})

export const billingVoucherReviewSchema = z.object({
  status: billingVoucherReviewStatusSchema,
  approvalPolicy: billingVoucherApprovalPolicySchema.default("none"),
  requestedByUserId: z.string().trim().min(1).nullable().default(null),
  requestedAt: z.string().trim().min(1).nullable().default(null),
  reviewedAt: z.string().trim().min(1).nullable().default(null),
  reviewedByUserId: z.string().trim().min(1).nullable().default(null),
  note: z.string().trim().default(""),
  requiredReason: z.string().trim().min(1).nullable().default(null),
  makerCheckerRequired: z.boolean().default(false),
})

export const billingVoucherDocumentTemplateSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  title: z.string().trim().min(1),
  format: billingVoucherDocumentFormatSchema,
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  content: z.string().trim(),
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
  dimensions: billingVoucherAccountingDimensionsSchema.default({
    branch: null,
    project: null,
    costCenter: null,
  }),
  review: billingVoucherReviewSchema.default({
    status: "not_required",
    approvalPolicy: "none",
    requestedByUserId: null,
    requestedAt: null,
    reviewedAt: null,
    reviewedByUserId: null,
    note: "",
    requiredReason: null,
    makerCheckerRequired: false,
  }),
  type: billingVoucherTypeSchema,
  date: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  narration: z.string().trim(),
  lines: z.array(billingVoucherLineSchema).min(2),
  gst: billingVoucherGstSchema.nullable(),
  sales: billingSalesInvoiceSchema.nullable().default(null),
  stock: billingVoucherStockSchema.nullable().default(null),
  financialYear: billingVoucherFinancialYearSchema,
  billAllocations: z.array(billingVoucherBillAllocationSchema),
  bankReconciliation: billingVoucherBankReconciliationSchema,
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
  productId: z.string().trim().min(1).nullable().default(null),
  warehouseId: z.string().trim().min(1).nullable().default(null),
  itemName: z.string().trim().min(1),
  description: z.string().trim().default(""),
  hsnOrSac: z.string().trim().min(1),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1),
  rate: z.number().positive(),
})

export const billingVoucherStockItemPayloadSchema = z.object({
  productId: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  quantity: z.number().finite(),
  unit: z.string().trim().min(1).default("Nos"),
  unitCost: z.number().nonnegative().default(0),
  landedCostAmount: z.number().nonnegative().default(0),
  note: z.string().trim().default(""),
}).refine((value) => value.quantity !== 0 || value.landedCostAmount > 0, {
  message: "Stock item must carry quantity movement or landed cost.",
})

export const billingVoucherStockPayloadSchema = z.object({
  items: z.array(billingVoucherStockItemPayloadSchema).min(1),
})

export const billingVoucherAccountingDimensionsPayloadSchema = z.object({
  branch: z.string().trim().nullable().default(null),
  project: z.string().trim().nullable().default(null),
  costCenter: z.string().trim().nullable().default(null),
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
  dimensions: billingVoucherAccountingDimensionsPayloadSchema.default({
    branch: null,
    project: null,
    costCenter: null,
  }),
  date: z.string().trim().min(1),
  counterparty: z.string().trim().default(""),
  narration: z.string().trim(),
  lines: z.array(billingVoucherUpsertLinePayloadSchema).default([]),
  gst: billingVoucherGstPayloadSchema.nullable().default(null),
  billAllocations: z.array(billingVoucherBillAllocationPayloadSchema).default([]),
  transport: billingVoucherTransportPayloadSchema.nullable().default(null),
  sales: billingSalesInvoicePayloadSchema.nullable().default(null),
  stock: billingVoucherStockPayloadSchema.nullable().default(null),
  generateEInvoice: z.boolean().default(false),
  generateEWayBill: z.boolean().default(false),
})

export const billingVoucherReviewPayloadSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().default(""),
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

export const billingVoucherBankReconciliationResponseSchema = z.object({
  item: billingVoucherSchema,
})

export const billingVoucherReviewResponseSchema = z.object({
  item: billingVoucherSchema,
})

export const billingVoucherDocumentResponseSchema = z.object({
  item: billingVoucherDocumentTemplateSchema,
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
  dimensions: billingVoucherAccountingDimensionsSchema,
  reviewStatus: billingVoucherReviewStatusSchema,
  reviewApprovalPolicy: billingVoucherApprovalPolicySchema,
  reviewRequestedByUserId: z.string().trim().min(1).nullable(),
  reviewRequestedAt: z.string().trim().min(1).nullable(),
  reviewReviewedAt: z.string().trim().min(1).nullable(),
  reviewReviewedByUserId: z.string().trim().min(1).nullable(),
  reviewNote: z.string().trim(),
  reviewRequiredReason: z.string().trim().min(1).nullable(),
  reviewMakerCheckerRequired: z.boolean(),
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

export const billingBankBookSchema = z.object({
  items: z.array(billingGeneralLedgerItemSchema),
})

export const billingCashBookSchema = z.object({
  items: z.array(billingGeneralLedgerItemSchema),
})

export const billingBankReconciliationEntrySchema = z.object({
  entryId: z.string().trim().min(1),
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: billingVoucherTypeSchema,
  voucherDate: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  narration: z.string().trim(),
  side: billingEntrySideSchema,
  amount: z.number().positive(),
  reconciliationStatus: billingBankReconciliationStatusSchema,
  clearedDate: z.string().trim().min(1).nullable(),
  statementReference: z.string().trim().min(1).nullable(),
  statementAmount: z.number().positive().nullable(),
  mismatchAmount: z.number().nonnegative().nullable(),
  pendingAgeDays: z.number().int().nonnegative().nullable(),
  note: z.string().trim(),
})

export const billingBankReconciliationLedgerSchema = z.object({
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  openingSide: billingEntrySideSchema,
  openingAmount: z.number().nonnegative(),
  closingSide: billingEntrySideSchema,
  closingAmount: z.number().nonnegative(),
  matchedEntryCount: z.number().int().nonnegative(),
  matchedDebitTotal: z.number().nonnegative(),
  matchedCreditTotal: z.number().nonnegative(),
  pendingDebitTotal: z.number().nonnegative(),
  pendingCreditTotal: z.number().nonnegative(),
  oldestPendingDays: z.number().int().nonnegative(),
  mismatchEntryCount: z.number().int().nonnegative(),
  mismatchAmountTotal: z.number().nonnegative(),
  matchedEntries: z.array(billingBankReconciliationEntrySchema),
  pendingEntries: z.array(billingBankReconciliationEntrySchema),
  mismatchedEntries: z.array(billingBankReconciliationEntrySchema),
})

export const billingBankReconciliationSchema = z.object({
  asOfDate: z.string().trim().min(1),
  matchedEntryCount: z.number().int().nonnegative(),
  matchedDebitTotal: z.number().nonnegative(),
  matchedCreditTotal: z.number().nonnegative(),
  pendingEntryCount: z.number().int().nonnegative(),
  pendingDebitTotal: z.number().nonnegative(),
  pendingCreditTotal: z.number().nonnegative(),
  oldestPendingDays: z.number().int().nonnegative(),
  mismatchEntryCount: z.number().int().nonnegative(),
  mismatchAmountTotal: z.number().nonnegative(),
  ledgers: z.array(billingBankReconciliationLedgerSchema),
})

export const billingCustomerStatementEntrySchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: z.enum(["sales", "sales_return", "credit_note", "receipt"]),
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
  voucherType: z.enum(["purchase", "purchase_return", "debit_note", "payment"]),
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

export const billingGstSalesRegisterItemSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: z.enum(["sales", "sales_return", "credit_note"]),
  documentLabel: z.enum(["tax_invoice", "sales_return", "credit_note"]),
  date: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  partyGstin: z.string().trim().min(1).nullable(),
  placeOfSupply: z.string().trim().min(1),
  supplyType: z.enum(["intra", "inter"]),
  hsnOrSac: z.string().trim().min(1),
  taxRate: z.number().nonnegative(),
  taxableAmount: z.number(),
  cgstAmount: z.number(),
  sgstAmount: z.number(),
  igstAmount: z.number(),
  totalTaxAmount: z.number(),
  invoiceAmount: z.number(),
  referenceVoucherNumber: z.string().trim().min(1).nullable(),
})

export const billingGstSalesRegisterSchema = z.object({
  asOfDate: z.string().trim().min(1),
  invoiceCount: z.number().int().nonnegative(),
  creditNoteCount: z.number().int().nonnegative(),
  taxableAmountTotal: z.number(),
  cgstAmountTotal: z.number(),
  sgstAmountTotal: z.number(),
  igstAmountTotal: z.number(),
  totalTaxAmountTotal: z.number(),
  invoiceAmountTotal: z.number(),
  items: z.array(billingGstSalesRegisterItemSchema),
})

export const billingGstPurchaseRegisterItemSchema = z.object({
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: z.enum(["purchase", "purchase_return", "debit_note"]),
  documentLabel: z.enum(["purchase_invoice", "purchase_return", "debit_note"]),
  date: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  partyGstin: z.string().trim().min(1).nullable(),
  placeOfSupply: z.string().trim().min(1),
  supplyType: z.enum(["intra", "inter"]),
  hsnOrSac: z.string().trim().min(1),
  taxRate: z.number().nonnegative(),
  taxableAmount: z.number(),
  cgstAmount: z.number(),
  sgstAmount: z.number(),
  igstAmount: z.number(),
  totalTaxAmount: z.number(),
  invoiceAmount: z.number(),
  referenceVoucherNumber: z.string().trim().min(1).nullable(),
})

export const billingGstPurchaseRegisterSchema = z.object({
  asOfDate: z.string().trim().min(1),
  invoiceCount: z.number().int().nonnegative(),
  debitNoteCount: z.number().int().nonnegative(),
  taxableAmountTotal: z.number(),
  cgstAmountTotal: z.number(),
  sgstAmountTotal: z.number(),
  igstAmountTotal: z.number(),
  totalTaxAmountTotal: z.number(),
  invoiceAmountTotal: z.number(),
  items: z.array(billingGstPurchaseRegisterItemSchema),
})

export const billingInputOutputTaxSummarySchema = z.object({
  asOfDate: z.string().trim().min(1),
  outputCgst: z.number(),
  outputSgst: z.number(),
  outputIgst: z.number(),
  outputTaxTotal: z.number(),
  inputCgst: z.number(),
  inputSgst: z.number(),
  inputIgst: z.number(),
  inputTaxTotal: z.number(),
  netCgstPayable: z.number(),
  netSgstPayable: z.number(),
  netIgstPayable: z.number(),
  netTaxPayable: z.number(),
})

export const billingGstFilingPeriodSummarySchema = z.object({
  periodKey: z.string().trim().min(1),
  label: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  salesInvoiceCount: z.number().int().nonnegative(),
  salesCreditNoteCount: z.number().int().nonnegative(),
  purchaseInvoiceCount: z.number().int().nonnegative(),
  purchaseDebitNoteCount: z.number().int().nonnegative(),
  outwardTaxableAmount: z.number(),
  inwardTaxableAmount: z.number(),
  outputTaxTotal: z.number(),
  inputTaxTotal: z.number(),
  netTaxPayable: z.number(),
})

export const billingGstFilingSummarySchema = z.object({
  latestPeriodKey: z.string().trim().min(1).nullable(),
  periods: z.array(billingGstFilingPeriodSummarySchema),
})

export const billingInventoryAuthoritySchema = z.object({
  masterOwner: z.enum(["core"]),
  warehouseOwner: z.enum(["core"]),
  transactionOwner: z.enum(["billing"]),
  valuationOwner: z.enum(["billing"]),
  summary: z.string().trim().min(1),
})

export const billingStockValuationMethodSchema = z.enum([
  "weighted_average",
  "moving_average",
  "fifo",
])

export const billingStockValuationPolicySchema = z.object({
  method: billingStockValuationMethodSchema,
  costSource: z.enum(["core_cost_price", "derived_movement_average"]),
  summary: z.string().trim().min(1),
})

export const billingStockLedgerEntrySchema = z.object({
  entryId: z.string().trim().min(1),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  warehouseName: z.string().trim().min(1),
  movementDate: z.string().trim().min(1),
  movementType: z.string().trim().min(1),
  quantityIn: z.number().nonnegative(),
  quantityOut: z.number().nonnegative(),
  balanceQuantity: z.number(),
  reservedQuantity: z.number().nonnegative(),
  availableQuantity: z.number(),
  unitCost: z.number().nonnegative(),
  movementValue: z.number(),
  balanceValue: z.number(),
  referenceType: z.string().trim().min(1).nullable(),
  referenceId: z.string().trim().min(1).nullable(),
  sourceApp: z.enum(["core", "billing"]),
  narration: z.string().trim(),
})

export const billingStockLedgerSchema = z.object({
  asOfDate: z.string().trim().min(1),
  items: z.array(billingStockLedgerEntrySchema),
})

export const billingStockAccountingRuleSchema = z.object({
  ruleKey: z.string().trim().min(1),
  label: z.string().trim().min(1),
  sourceVoucherTypes: z.array(billingVoucherTypeSchema).min(1),
  debitTarget: z.string().trim().min(1),
  creditTarget: z.string().trim().min(1),
  status: z.enum(["active", "foundation"]),
  summary: z.string().trim().min(1),
})

export const billingStockAccountingRuleBookSchema = z.object({
  items: z.array(billingStockAccountingRuleSchema),
})

export const billingStockValuationReportItemSchema = z.object({
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  warehouseId: z.string().trim().min(1),
  warehouseName: z.string().trim().min(1),
  quantityOnHand: z.number(),
  unitCost: z.number().nonnegative(),
  inventoryValue: z.number(),
  valuationMethod: billingStockValuationMethodSchema,
  lastMovementDate: z.string().trim().min(1).nullable(),
})

export const billingStockValuationReportSchema = z.object({
  asOfDate: z.string().trim().min(1),
  valuationMethod: billingStockValuationMethodSchema,
  totalInventoryValue: z.number(),
  items: z.array(billingStockValuationReportItemSchema),
})

export const billingWarehouseStockPositionItemSchema = z.object({
  warehouseId: z.string().trim().min(1),
  warehouseName: z.string().trim().min(1),
  productCount: z.number().int().nonnegative(),
  quantityOnHand: z.number(),
  reservedQuantity: z.number().nonnegative(),
  availableQuantity: z.number(),
  inventoryValue: z.number(),
})

export const billingWarehouseStockPositionSchema = z.object({
  asOfDate: z.string().trim().min(1),
  totalInventoryValue: z.number(),
  items: z.array(billingWarehouseStockPositionItemSchema),
})

export const billingAccountingExceptionTypeSchema = z.enum([
  "altered",
  "reversed",
  "back_dated",
])

export const billingAccountingExceptionItemSchema = z.object({
  exceptionType: billingAccountingExceptionTypeSchema,
  voucherId: z.string().trim().min(1),
  voucherNumber: z.string().trim().min(1),
  voucherType: billingVoucherTypeSchema,
  voucherStatus: billingVoucherLifecycleStatusSchema,
  voucherDate: z.string().trim().min(1),
  createdAt: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  counterparty: z.string().trim().min(1),
  amount: z.number().nonnegative(),
  daysBackDated: z.number().int().nonnegative(),
  dimensions: billingVoucherAccountingDimensionsSchema,
  reviewStatus: billingVoucherReviewStatusSchema,
  note: z.string().trim(),
})

export const billingAccountingExceptionsSchema = z.object({
  alteredCount: z.number().int().nonnegative(),
  reversedCount: z.number().int().nonnegative(),
  backDatedCount: z.number().int().nonnegative(),
  items: z.array(billingAccountingExceptionItemSchema),
})

export const billingFinanceDashboardSchema = z.object({
  asOfDate: z.string().trim().min(1),
  postedVoucherCount: z.number().int().nonnegative(),
  pendingReviewCount: z.number().int().nonnegative(),
  pendingReviewAmount: z.number().nonnegative(),
  reversedVoucherCount: z.number().int().nonnegative(),
  reversedVoucherAmount: z.number().nonnegative(),
  backDatedVoucherCount: z.number().int().nonnegative(),
  receivableTotal: z.number().nonnegative(),
  payableTotal: z.number().nonnegative(),
  bankPendingEntryCount: z.number().int().nonnegative(),
  bankMismatchAmount: z.number().nonnegative(),
  inventoryValue: z.number().nonnegative(),
  cashBalance: z.number().nonnegative(),
  bankBalance: z.number().nonnegative(),
})

export const billingAuditTrailEntrySchema = z.object({
  id: z.string().trim().min(1),
  action: z.string().trim().min(1),
  level: z.enum(["info", "warn", "error"]),
  message: z.string().trim().min(1),
  actorEmail: z.string().trim().nullable().default(null),
  actorType: z.string().trim().nullable().default(null),
  routePath: z.string().trim().nullable().default(null),
  voucherId: z.string().trim().nullable().default(null),
  voucherNumber: z.string().trim().nullable().default(null),
  reversalVoucherNumber: z.string().trim().nullable().default(null),
  createdAt: z.string().trim().min(1),
})

export const billingAuditTrailReviewSchema = z.object({
  totalEntries: z.number().int().nonnegative(),
  infoCount: z.number().int().nonnegative(),
  warnCount: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  createCount: z.number().int().nonnegative(),
  postCount: z.number().int().nonnegative(),
  cancelCount: z.number().int().nonnegative(),
  deleteCount: z.number().int().nonnegative(),
  reverseCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  reconcileCount: z.number().int().nonnegative(),
  items: z.array(billingAuditTrailEntrySchema),
})

export const billingAuditTrailReviewResponseSchema = z.object({
  item: billingAuditTrailReviewSchema,
})

export const billingMonthEndChecklistStatusSchema = z.enum([
  "ready",
  "attention",
  "blocked",
])

export const billingMonthEndChecklistItemSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  status: billingMonthEndChecklistStatusSchema,
  value: z.string().trim().min(1),
  detail: z.string().trim().min(1),
})

export const billingMonthEndChecklistSchema = z.object({
  asOfDate: z.string().trim().min(1),
  readyCount: z.number().int().nonnegative(),
  attentionCount: z.number().int().nonnegative(),
  blockedCount: z.number().int().nonnegative(),
  items: z.array(billingMonthEndChecklistItemSchema),
})

export const billingFinancialYearCloseWorkflowStatusSchema = z.enum([
  "not_started",
  "blocked",
  "ready_to_close",
  "closed",
])

export const billingFinancialYearCloseWorkflowSchema = z.object({
  financialYearCode: z.string().trim().min(1),
  financialYearLabel: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  voucherCount: z.number().int().nonnegative(),
  status: billingFinancialYearCloseWorkflowStatusSchema,
  blockedItemCount: z.number().int().nonnegative(),
  readyItemCount: z.number().int().nonnegative(),
  lastEvaluatedAt: z.string().trim().min(1),
  closedAt: z.string().trim().min(1).nullable().default(null),
  closedByUserId: z.string().trim().min(1).nullable().default(null),
  note: z.string().trim().default(""),
})

export const billingFinancialYearCloseWorkflowActionPayloadSchema = z.object({
  action: z.enum(["preview", "close"]),
  financialYearCode: z.string().trim().min(1).nullable().default(null),
  note: z.string().trim().default(""),
})

export const billingFinancialYearCloseWorkflowResponseSchema = z.object({
  item: billingFinancialYearCloseWorkflowSchema,
})

export const billingOpeningBalanceRolloverStatusSchema = z.enum([
  "previewed",
  "applied",
])

export const billingOpeningBalanceRolloverItemSchema = z.object({
  ledgerId: z.string().trim().min(1),
  ledgerName: z.string().trim().min(1),
  ledgerGroup: z.string().trim().min(1),
  ledgerNature: z.enum(["asset", "liability", "income", "expense"]),
  sourceClosingSide: billingEntrySideSchema,
  sourceClosingAmount: z.number().nonnegative(),
  rolloverSide: billingEntrySideSchema,
  rolloverAmount: z.number().nonnegative(),
  policyTreatment: z.enum(["carry_forward", "reset_nominal"]),
})

export const billingOpeningBalanceRolloverPolicySchema = z.object({
  sourceFinancialYearCode: z.string().trim().min(1),
  targetFinancialYearCode: z.string().trim().min(1),
  targetFinancialYearLabel: z.string().trim().min(1),
  status: billingOpeningBalanceRolloverStatusSchema,
  itemCount: z.number().int().nonnegative(),
  carryForwardLedgerCount: z.number().int().nonnegative(),
  resetLedgerCount: z.number().int().nonnegative(),
  preparedAt: z.string().trim().min(1),
  preparedByUserId: z.string().trim().min(1).nullable().default(null),
  appliedAt: z.string().trim().min(1).nullable().default(null),
  appliedByUserId: z.string().trim().min(1).nullable().default(null),
  note: z.string().trim().default(""),
  items: z.array(billingOpeningBalanceRolloverItemSchema),
})

export const billingOpeningBalanceRolloverActionPayloadSchema = z.object({
  action: z.enum(["preview", "apply"]),
  sourceFinancialYearCode: z.string().trim().min(1).nullable().default(null),
  note: z.string().trim().default(""),
})

export const billingOpeningBalanceRolloverResponseSchema = z.object({
  item: billingOpeningBalanceRolloverPolicySchema,
})

export const billingYearEndAdjustmentControlStatusSchema = z.enum([
  "previewed",
  "applied",
])

export const billingYearEndAdjustmentControlItemSchema = z.object({
  controlKey: z.string().trim().min(1),
  label: z.string().trim().min(1),
  status: z.enum(["ready", "attention", "blocked"]),
  value: z.string().trim().min(1),
  detail: z.string().trim().min(1),
  recommendedAction: z.string().trim().min(1),
})

export const billingYearEndAdjustmentControlPolicySchema = z.object({
  sourceFinancialYearCode: z.string().trim().min(1),
  targetFinancialYearCode: z.string().trim().min(1),
  targetFinancialYearLabel: z.string().trim().min(1),
  status: billingYearEndAdjustmentControlStatusSchema,
  journalVoucherCount: z.number().int().nonnegative(),
  nominalLedgerCount: z.number().int().nonnegative(),
  carryForwardLedgerCount: z.number().int().nonnegative(),
  blockedItemCount: z.number().int().nonnegative(),
  attentionItemCount: z.number().int().nonnegative(),
  preparedAt: z.string().trim().min(1),
  preparedByUserId: z.string().trim().min(1).nullable().default(null),
  appliedAt: z.string().trim().min(1).nullable().default(null),
  appliedByUserId: z.string().trim().min(1).nullable().default(null),
  note: z.string().trim().default(""),
  items: z.array(billingYearEndAdjustmentControlItemSchema),
})

export const billingYearEndAdjustmentControlActionPayloadSchema = z.object({
  action: z.enum(["preview", "apply"]),
  sourceFinancialYearCode: z.string().trim().min(1).nullable().default(null),
  note: z.string().trim().default(""),
})

export const billingYearEndAdjustmentControlResponseSchema = z.object({
  item: billingYearEndAdjustmentControlPolicySchema,
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
  bankBook: billingBankBookSchema,
  cashBook: billingCashBookSchema,
  bankReconciliation: billingBankReconciliationSchema,
  customerStatement: billingCustomerStatementSchema,
  supplierStatement: billingSupplierStatementSchema,
  gstSalesRegister: billingGstSalesRegisterSchema,
  gstPurchaseRegister: billingGstPurchaseRegisterSchema,
  inputOutputTaxSummary: billingInputOutputTaxSummarySchema,
  gstFilingSummary: billingGstFilingSummarySchema,
  inventoryAuthority: billingInventoryAuthoritySchema,
  stockValuationPolicy: billingStockValuationPolicySchema,
  stockLedger: billingStockLedgerSchema,
  stockAccountingRules: billingStockAccountingRuleBookSchema,
  warehouseStockPosition: billingWarehouseStockPositionSchema,
  stockValuationReport: billingStockValuationReportSchema,
  exceptions: billingAccountingExceptionsSchema,
  financeDashboard: billingFinanceDashboardSchema,
  monthEndChecklist: billingMonthEndChecklistSchema,
  financialYearCloseWorkflow: billingFinancialYearCloseWorkflowSchema.nullable(),
  openingBalanceRolloverPolicy: billingOpeningBalanceRolloverPolicySchema.nullable(),
  yearEndAdjustmentControlPolicy: billingYearEndAdjustmentControlPolicySchema.nullable(),
})

export const billingAccountingReportsResponseSchema = z.object({
  item: billingAccountingReportsSchema,
})

export type BillingVoucherType = z.infer<typeof billingVoucherTypeSchema>
export type BillingVoucherLifecycleStatus = z.infer<
  typeof billingVoucherLifecycleStatusSchema
>
export type BillingVoucherReviewStatus = z.infer<
  typeof billingVoucherReviewStatusSchema
>
export type BillingVoucherReversePayload = z.infer<
  typeof billingVoucherReversePayloadSchema
>
export type BillingBankReconciliationStatus = z.infer<
  typeof billingBankReconciliationStatusSchema
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
export type BillingVoucherStockItem = z.infer<typeof billingVoucherStockItemSchema>
export type BillingVoucherStock = z.infer<typeof billingVoucherStockSchema>
export type BillingVoucher = z.infer<typeof billingVoucherSchema>
export type BillingVoucherReview = z.infer<typeof billingVoucherReviewSchema>
export type BillingVoucherApprovalPolicy = z.infer<
  typeof billingVoucherApprovalPolicySchema
>
export type BillingVoucherAccountingDimensions = z.infer<
  typeof billingVoucherAccountingDimensionsSchema
>
export type BillingVoucherBankReconciliation = z.infer<
  typeof billingVoucherBankReconciliationSchema
>
export type BillingVoucherHeader = z.infer<typeof billingVoucherHeaderSchema>
export type BillingVoucherLineRecord = z.infer<typeof billingVoucherLineRecordSchema>
export type BillingLedgerEntry = z.infer<typeof billingLedgerEntrySchema>
export type BillingVoucherDocumentTemplate = z.infer<
  typeof billingVoucherDocumentTemplateSchema
>
export type BillingVoucherUpsertPayload = z.infer<
  typeof billingVoucherUpsertPayloadSchema
>
export type BillingSalesInvoicePayload = z.infer<
  typeof billingSalesInvoicePayloadSchema
>
export type BillingVoucherStockPayload = z.infer<
  typeof billingVoucherStockPayloadSchema
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
export type BillingVoucherReviewPayload = z.infer<
  typeof billingVoucherReviewPayloadSchema
>
export type BillingVoucherReviewResponse = z.infer<
  typeof billingVoucherReviewResponseSchema
>
export type BillingVoucherBankReconciliationPayload = z.infer<
  typeof billingVoucherBankReconciliationPayloadSchema
>
export type BillingVoucherBankReconciliationResponse = z.infer<
  typeof billingVoucherBankReconciliationResponseSchema
>
export type BillingVoucherDocumentFormat = z.infer<
  typeof billingVoucherDocumentFormatSchema
>
export type BillingVoucherDocumentResponse = z.infer<
  typeof billingVoucherDocumentResponseSchema
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
export type BillingBankBook = z.infer<typeof billingBankBookSchema>
export type BillingCashBook = z.infer<typeof billingCashBookSchema>
export type BillingBankReconciliationEntry = z.infer<
  typeof billingBankReconciliationEntrySchema
>
export type BillingBankReconciliationLedger = z.infer<
  typeof billingBankReconciliationLedgerSchema
>
export type BillingBankReconciliation = z.infer<
  typeof billingBankReconciliationSchema
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
export type BillingGstSalesRegisterItem = z.infer<
  typeof billingGstSalesRegisterItemSchema
>
export type BillingGstSalesRegister = z.infer<
  typeof billingGstSalesRegisterSchema
>
export type BillingGstPurchaseRegisterItem = z.infer<
  typeof billingGstPurchaseRegisterItemSchema
>
export type BillingGstPurchaseRegister = z.infer<
  typeof billingGstPurchaseRegisterSchema
>
export type BillingInputOutputTaxSummary = z.infer<
  typeof billingInputOutputTaxSummarySchema
>
export type BillingGstFilingPeriodSummary = z.infer<
  typeof billingGstFilingPeriodSummarySchema
>
export type BillingGstFilingSummary = z.infer<
  typeof billingGstFilingSummarySchema
>
export type BillingInventoryAuthority = z.infer<
  typeof billingInventoryAuthoritySchema
>
export type BillingStockValuationMethod = z.infer<
  typeof billingStockValuationMethodSchema
>
export type BillingStockValuationPolicy = z.infer<
  typeof billingStockValuationPolicySchema
>
export type BillingStockLedgerEntry = z.infer<
  typeof billingStockLedgerEntrySchema
>
export type BillingStockLedger = z.infer<typeof billingStockLedgerSchema>
export type BillingStockAccountingRule = z.infer<
  typeof billingStockAccountingRuleSchema
>
export type BillingStockAccountingRuleBook = z.infer<
  typeof billingStockAccountingRuleBookSchema
>
export type BillingWarehouseStockPositionItem = z.infer<
  typeof billingWarehouseStockPositionItemSchema
>
export type BillingWarehouseStockPosition = z.infer<
  typeof billingWarehouseStockPositionSchema
>
export type BillingStockValuationReport = z.infer<
  typeof billingStockValuationReportSchema
>
export type BillingAccountingExceptionType = z.infer<
  typeof billingAccountingExceptionTypeSchema
>
export type BillingAccountingExceptionItem = z.infer<
  typeof billingAccountingExceptionItemSchema
>
export type BillingAccountingExceptions = z.infer<
  typeof billingAccountingExceptionsSchema
>
export type BillingFinanceDashboard = z.infer<
  typeof billingFinanceDashboardSchema
>
export type BillingAuditTrailEntry = z.infer<typeof billingAuditTrailEntrySchema>
export type BillingAuditTrailReview = z.infer<typeof billingAuditTrailReviewSchema>
export type BillingMonthEndChecklist = z.infer<
  typeof billingMonthEndChecklistSchema
>
export type BillingFinancialYearCloseWorkflow = z.infer<
  typeof billingFinancialYearCloseWorkflowSchema
>
export type BillingFinancialYearCloseWorkflowActionPayload = z.infer<
  typeof billingFinancialYearCloseWorkflowActionPayloadSchema
>
export type BillingOpeningBalanceRolloverPolicy = z.infer<
  typeof billingOpeningBalanceRolloverPolicySchema
>
export type BillingOpeningBalanceRolloverActionPayload = z.infer<
  typeof billingOpeningBalanceRolloverActionPayloadSchema
>
export type BillingYearEndAdjustmentControlItem = z.infer<
  typeof billingYearEndAdjustmentControlItemSchema
>
export type BillingYearEndAdjustmentControlPolicy = z.infer<
  typeof billingYearEndAdjustmentControlPolicySchema
>
export type BillingYearEndAdjustmentControlActionPayload = z.infer<
  typeof billingYearEndAdjustmentControlActionPayloadSchema
>
export type BillingAccountingReports = z.infer<
  typeof billingAccountingReportsSchema
>
export type BillingAccountingReportsResponse = z.infer<
  typeof billingAccountingReportsResponseSchema
>
export type BillingFinancialYearCloseWorkflowResponse = z.infer<
  typeof billingFinancialYearCloseWorkflowResponseSchema
>
export type BillingOpeningBalanceRolloverResponse = z.infer<
  typeof billingOpeningBalanceRolloverResponseSchema
>
export type BillingYearEndAdjustmentControlResponse = z.infer<
  typeof billingYearEndAdjustmentControlResponseSchema
>
export type BillingAuditTrailReviewResponse = z.infer<
  typeof billingAuditTrailReviewResponseSchema
>
