import { z } from "zod";
export const productInformationSchema = z
  .object({
    coreProductId: z.number().int().positive("Select a Core product."),
    brandId: z.number().int().positive().nullable(),
    storefrontTitle: z.string().trim().min(1, "Storefront title is required."),
    subtitle: z.string().trim().max(255),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Use lowercase letters, numbers, and hyphens."),
    shortDescription: z.string().max(500),
    description: z.string(),
    bulletPoints: z.array(z.string().trim().min(1)).max(20),
    material: z.string().trim().max(191),
    countryOfOrigin: z.string().trim().max(191),
    manufacturer: z.string().trim().max(255),
    warranty: z.string().trim().max(1000),
    returnPolicy: z.string().trim().max(2000),
    shippingClass: z.string().trim().max(100),
    weight: z.number().nonnegative().nullable(),
    length: z.number().nonnegative().nullable(),
    width: z.number().nonnegative().nullable(),
    height: z.number().nonnegative().nullable(),
    minimumOrderQuantity: z.number().int().positive(),
    maximumOrderQuantity: z.number().int().positive().nullable(),
    seoTitle: z.string().max(191),
    seoDescription: z.string().max(320),
    publicationStatus: z.enum(["draft", "published", "archived"]),
    isFeatured: z.boolean()
  })
  .refine(
    (value) =>
      value.maximumOrderQuantity === null ||
      value.maximumOrderQuantity >= value.minimumOrderQuantity,
    {
      message: "Maximum order quantity must be greater than or equal to the minimum.",
      path: ["maximumOrderQuantity"]
    }
  );
