import { z } from "zod";

export const brandsSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  isActive: z.boolean(),
  logoAlt: z.string().trim().max(255, "Logo alt text is too long."),
  logoUrl: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .url("Enter a valid logo URL.")
      .startsWith("https://", "Logo URL must use HTTPS.")
  ]),
  showOnStorefront: z.boolean(),
  sortOrder: z.number().int().min(0, "Sort order cannot be negative.")
});
