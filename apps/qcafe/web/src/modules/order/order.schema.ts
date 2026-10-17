import { z } from "zod";
export const bookingSchema = z
  .object({
    customerName: z.string().trim().min(1, "Enter the customer name.").max(120),
    mobile: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/u, "Enter a mobile number with 7 to 15 digits."),
    pickupAt: z.iso.datetime({ offset: true })
  })
  .strict();
export const orderInputSchema = z
  .object({
    requestId: z.uuid(),
    booking: bookingSchema.nullable().optional(),
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
