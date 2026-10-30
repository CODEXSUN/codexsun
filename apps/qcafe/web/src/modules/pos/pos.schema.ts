import { z } from "zod";
export const posInputSchema = z
  .object({
    requestId: z.uuid(),
    lines: z
      .array(
        z
          .object({
            menuUuid: z.string().regex(/^[a-f0-9]{8}$/u),
            quantity: z.number().positive().max(999).multipleOf(0.001)
          })
          .strict()
      )
      .min(1, "Add an item before saving.")
      .max(100)
  })
  .strict();
export const paymentSchema = z
  .object({
    requestId: z.uuid(),
    amount: z.number().int().positive("Enter a payment greater than zero.").max(100_000_000),
    mode: z.enum(["cash", "card", "upi", "bank", "other"]),
    reference: z.string().trim().max(120)
  })
  .strict();
