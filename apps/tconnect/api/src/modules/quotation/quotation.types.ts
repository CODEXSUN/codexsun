import { z } from "zod";
const id = z.string().regex(/^[0-9a-f]{8}$/);
export const quotationInput = z
  .object({
    conversationUuid: id,
    quantity: z.number().min(0.001).max(1000000).multipleOf(0.001),
    unit: z.string().trim().min(1).max(40),
    unitPrice: z.number().min(0).max(1000000000).multipleOf(0.01),
    taxPercent: z.number().min(0).max(100).multipleOf(0.01),
    shipping: z.number().min(0).max(1000000000).multipleOf(0.01),
    deliveryDays: z.number().int().min(1).max(3650),
    validUntil: z.iso.date(),
    paymentTerms: z.string().trim().min(3).max(1000),
    notes: z.string().trim().max(4000).default("")
  })
  .strict();
export const quotationRecord = quotationInput.extend({
  uuid: id,
  currency: z.literal("INR"),
  subtotal: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  status: z.enum(["sent", "withdrawn"]),
  createdAt: z.string(),
  sellerName: z.string(),
  buyerBusiness: z.string(),
  requirementUuid: id.nullable(),
  inquiryUuid: id.nullable(),
  subject: z.string()
});
export type QuotationInput = z.infer<typeof quotationInput>;
export type QuotationRecord = z.infer<typeof quotationRecord>;
export function quotationTotals(
  input: Pick<QuotationInput, "quantity" | "unitPrice" | "taxPercent" | "shipping">
) {
  const subtotal =
    (BigInt(Math.round(input.quantity * 1000)) * BigInt(Math.round(input.unitPrice * 100)) + 500n) /
    1000n;
  const tax = (subtotal * BigInt(Math.round(input.taxPercent * 100)) + 5000n) / 10000n;
  const total = subtotal + tax + BigInt(Math.round(input.shipping * 100));
  if (total > 100000000000000n)
    throw new RangeError("Quotation total must not exceed INR 1,000,000,000,000.");
  return {
    subtotal: Number(subtotal) / 100,
    taxAmount: Number(tax) / 100,
    total: Number(total) / 100
  };
}
