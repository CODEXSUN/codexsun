import { z } from "zod";
export const orderInputSchema = z
  .object({
    requestId: z.uuid(),
    revision: z.number().int().nonnegative(),
    action: z.enum(["save", "kitchen", "bill", "cancel"]),
    name: z.string().trim().min(1).max(40),
    mode: z.enum(["POS", "KOT", "TAKE AWAY"]),
    tableUuid: z
      .string()
      .regex(/^[a-f0-9]{8}$/u)
      .nullable(),
    seats: z.array(z.number().int().min(1).max(50)).max(50),
    lines: z
      .array(
        z
          .object({
            menuUuid: z.string().regex(/^[a-f0-9]{8}$/u),
            quantity: z.number().positive().max(999).multipleOf(0.001)
          })
          .strict()
      )
      .max(100)
  })
  .strict();
