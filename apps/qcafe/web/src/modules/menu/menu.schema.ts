import { z } from "zod";
export const menuSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Code is required.")
      .max(40)
      .regex(/^[a-zA-Z0-9_-]+$/u, "Use letters, numbers, dashes, or underscores."),
    name: z.string().trim().min(1, "Name is required.").max(160),
    category: z.string().trim().min(1, "Category is required.").max(100),
    imageUrl: z
      .union([
        z.literal(""),
        z.url().max(2000).startsWith("https://"),
        z.string().regex(/^\/api\/app\/qcafe\/menu\/images\/[a-f0-9]{32}\.webp$/u)
      ])
      .optional(),
    specialPrices: z
      .array(
        z
          .object({
            prefix: z.string().trim().toUpperCase().min(1, "Choose a Today Special.").max(20),
            price: z
              .number()
              .int()
              .positive("Enter a special price greater than zero.")
              .max(100_000_000),
            isEnabled: z.boolean()
          })
          .strict()
      )
      .max(50)
      .refine(
        (items) => new Set(items.map((item) => item.prefix)).size === items.length,
        "Choose each special only once."
      )
      .optional(),
    price: z.number().int().positive("Enter a price greater than zero.").max(100_000_000),
    status: z.enum(["active", "inactive"])
  })
  .strict();
