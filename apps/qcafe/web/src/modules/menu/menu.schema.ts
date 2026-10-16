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
    imageUrl: z.union([z.literal(""), z.url().max(2000).startsWith("https://")]).optional(),
    price: z.number().int().positive("Enter a price greater than zero.").max(100_000_000),
    status: z.enum(["active", "inactive"])
  })
  .strict();
