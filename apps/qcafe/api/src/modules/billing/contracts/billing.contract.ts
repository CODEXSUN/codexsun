import { z } from "zod";

export const billingScopeSchema = z.object({ businessId: z.string().uuid(), locationId: z.string().uuid() });
export const billIdSchema = z.object({ billId: z.string().uuid() });
export const paymentIdSchema = z.object({ paymentId: z.string().uuid() });
export const voucherIdSchema = z.object({ voucherId: z.string().uuid() });
export const cashShiftIdSchema = z.object({ cashShiftId: z.string().uuid() });
export const businessDayIdSchema = z.object({ businessDayId: z.string().uuid() });

export const createTaxRateSchema = z.object({
  basisPoints: z.number().int().min(0).max(10_000),
  businessId: z.string().uuid(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
});

export const postBillSchema = z.object({ orderId: z.string().uuid() });
export const postPaymentSchema = z.object({
  amountMinor: z.number().int().positive(),
  approvalCode: z.string().trim().max(80).optional(),
  cashShiftId: z.string().uuid().optional(),
  maskedReference: z
    .string()
    .trim()
    .max(80)
    .regex(/^(?:\*{2,}|x{2,}|X{2,})[A-Za-z0-9 -]{2,20}$/, "Use a masked tender reference, for example ****4242.")
    .optional(),
  paymentMethodId: z.string().uuid(),
  providerReference: z.string().trim().max(160).optional(),
  receivedMinor: z.number().int().positive().optional(),
  status: z.enum(["failed", "posted"]).default("posted"),
  failureReason: z.string().trim().min(3).max(500).optional(),
});
export const refundPaymentSchema = z.object({
  amountMinor: z.number().int().positive(),
  reason: z.string().trim().min(3).max(500),
});
export const reversePaymentSchema = z.object({ reason: z.string().trim().min(3).max(500) });
export const openCashShiftSchema = z.object({
  businessDayId: z.string().uuid(),
  drawerId: z.string().uuid(),
  openingFloatMinor: z.number().int().min(0),
});
export const cashMovementSchema = z.object({
  amountMinor: z.number().int().positive(),
  approvedBy: z.string().trim().max(120).optional(),
  kind: z.enum(["cash_in", "cash_out", "safe_drop"]),
  reason: z.string().trim().min(3).max(500),
});
export const settleCashShiftSchema = z.object({
  approvedBy: z.string().trim().max(120).optional(),
  countedMinor: z.number().int().min(0),
  varianceReason: z.string().trim().min(3).max(500).optional(),
});
export const issueVoucherSchema = billingScopeSchema.extend({
  amountMinor: z.number().int().positive(),
  customerRef: z.string().trim().max(160).optional(),
  eventRef: z.string().trim().max(160).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  paymentMethodId: z.string().uuid(),
  providerReference: z.string().trim().max(160).optional(),
});
export const applyVoucherSchema = z.object({
  amountMinor: z.number().int().positive(),
  billId: z.string().uuid(),
});
export const billingWorkspaceSchema = z.object({
  bills: z.array(z.record(z.unknown())),
  billLines: z.array(z.record(z.unknown())),
  billTaxes: z.array(z.record(z.unknown())),
  taxRates: z.array(z.record(z.unknown())),
  paymentMethods: z.array(z.record(z.unknown())),
  payments: z.array(z.record(z.unknown())),
  tenderDetails: z.array(z.record(z.unknown())),
  receipts: z.array(z.record(z.unknown())),
  vouchers: z.array(z.record(z.unknown())),
  voucherApplications: z.array(z.record(z.unknown())),
  refunds: z.array(z.record(z.unknown())),
  drawers: z.array(z.record(z.unknown())),
  cashShifts: z.array(z.record(z.unknown())),
  cashMovements: z.array(z.record(z.unknown())),
  settlements: z.array(z.record(z.unknown())),
  dayCloses: z.array(z.record(z.unknown())),
});

export type BillingScope = z.infer<typeof billingScopeSchema>;
export type PostPayment = z.infer<typeof postPaymentSchema>;
export type IssueVoucher = z.infer<typeof issueVoucherSchema>;
