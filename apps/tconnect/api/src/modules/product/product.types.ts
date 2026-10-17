import { z } from "zod";
import { brandImage } from "../company/index.js";
export const productInput = z
  .object({
    companyUuid: z.string().regex(/^[0-9a-f]{8}$/),
    name: z.string().trim().min(2).max(160),
    category: z.string().trim().min(2).max(80),
    description: z.string().trim().min(10).max(5000),
    price: z.number().min(0).max(1000000000).nullable(),
    unit: z.string().trim().min(1).max(40),
    minimumOrder: z.string().trim().min(1).max(100),
    imageDataUrl: brandImage,
    status: z.enum(["active", "inactive"])
  })
  .strict();
export const productRecord = productInput.extend({ uuid: z.string().regex(/^[0-9a-f]{8}$/) });
export type ProductInput = z.infer<typeof productInput>;
export type ProductRecord = z.infer<typeof productRecord>;

export const productSearchQuery = z.object({ q: z.string().trim().max(160).default("") }).strict();
export const catalogProduct = productRecord.extend({
  sellerName: z.string(),
  sellerSlug: z.string(),
  city: z.string(),
  industry: z.string()
});
export type CatalogProduct = z.infer<typeof catalogProduct>;
