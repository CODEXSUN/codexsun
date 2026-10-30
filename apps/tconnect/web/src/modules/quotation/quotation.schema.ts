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
