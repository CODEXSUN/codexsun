import { z } from "zod";
export const productImageSchema = z.object({
  productInformationId: z.number().int().positive("Select a product."),
  variantId: z.number().int().positive().nullable(),
  url: z
    .string()
    .refine(
      (value) =>
        z.url().safeParse(value).success ||
        value.startsWith("/api/platform/storefront/product-images/"),
      "Choose an image or enter a valid image URL."
    ),
  altText: z.string().trim().min(1, "Alternative text is required.").max(255),
  caption: z.string().trim().max(500),
  sortOrder: z.number().int().nonnegative(),
  isPrimary: z.boolean(),
  status: z.enum(["active", "inactive"])
});
