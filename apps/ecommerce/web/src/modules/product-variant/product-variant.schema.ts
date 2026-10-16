import { z } from "zod";
export const productVariantSchema = z.object({
  productInformationId: z.number().int().positive("Select a product."),
  sku: z.string().trim().min(1, "SKU is required.").max(100),
  title: z.string().trim().min(1, "Title is required.").max(255),
  barcode: z.string().trim().max(100),
  option1Name: z.string().trim().max(100),
  option1Value: z.string().trim().max(191),
  option2Name: z.string().trim().max(100),
  option2Value: z.string().trim().max(191),
  option3Name: z.string().trim().max(100),
  option3Value: z.string().trim().max(191),
  priceAdjustment: z.number(),
  compareAtAdjustment: z.number(),
  costAdjustment: z.number(),
  weight: z.number().nonnegative(),
  sortOrder: z.number().int().nonnegative(),
  status: z.enum(["active", "inactive"])
});
