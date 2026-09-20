import { z } from "zod";

const code = z.string().trim().min(1).max(40).transform((value) => value.toUpperCase());
const currency = z.string().trim().length(3).transform((value) => value.toUpperCase());

export const createMenuCategorySchema = z.object({
  businessId: z.string().uuid(),
  code,
  name: z.string().trim().min(2).max(120),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});
export const createMenuItemSchema = z.object({
  businessId: z.string().uuid(),
  categoryId: z.string().uuid(),
  code,
  itemType: z.enum(["food", "beverage", "packaged", "service"]),
  name: z.string().trim().min(2).max(160),
  taxCode: z.string().trim().max(40).optional(),
});
export const createMenuVariantSchema = z.object({
  code,
  itemId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
});
export const createPriceBookSchema = z.object({
  businessId: z.string().uuid(),
  code,
  currency,
  name: z.string().trim().min(2).max(120),
});
export const setMenuPriceSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  itemId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  priceBookId: z.string().uuid(),
  serviceChannelId: z.string().uuid().optional(),
  validFrom: z.string().date(),
  validTo: z.string().date().optional(),
  variantId: z.string().uuid().optional(),
});
export const menuCatalogQuerySchema = z.object({ businessId: z.string().uuid() });
export const effectivePriceQuerySchema = z.object({
  businessDate: z.string().date(),
  itemId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  priceBookId: z.string().uuid(),
  serviceChannelId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
});

const categorySchema = z.object({ id: z.string(), code: z.string(), name: z.string(), sortOrder: z.number(), active: z.boolean() });
const itemSchema = z.object({
  id: z.string(), businessId: z.string(), categoryId: z.string(), code: z.string(), name: z.string(),
  itemType: z.enum(["food", "beverage", "packaged", "service"]), taxCode: z.string().nullable(), active: z.boolean(),
  variants: z.array(z.object({ id: z.string(), code: z.string(), name: z.string(), active: z.boolean() })),
});
const priceBookSchema = z.object({ id: z.string(), code: z.string(), name: z.string(), currency: z.string(), active: z.boolean() });
const priceSchema = z.object({
  id: z.string(), priceBookId: z.string(), itemId: z.string(), variantId: z.string().nullable(),
  locationId: z.string().nullable(), serviceChannelId: z.string().nullable(), amountMinor: z.number(),
  validFrom: z.string(), validTo: z.string().nullable(), active: z.boolean(),
});

export const menuCatalogResponseSchema = z.object({
  categories: z.array(categorySchema),
  items: z.array(itemSchema),
  priceBooks: z.array(priceBookSchema),
  prices: z.array(priceSchema),
});
export const effectivePriceResponseSchema = z.object({ price: priceSchema.nullable() });
export const menuErrorSchema = z.object({ error: z.string() });

export type CreateMenuCategory = z.infer<typeof createMenuCategorySchema>;
export type CreateMenuItem = z.infer<typeof createMenuItemSchema>;
export type CreateMenuVariant = z.infer<typeof createMenuVariantSchema>;
export type CreatePriceBook = z.infer<typeof createPriceBookSchema>;
export type SetMenuPrice = z.infer<typeof setMenuPriceSchema>;
export type MenuCatalog = z.infer<typeof menuCatalogResponseSchema>;
export type MenuPrice = MenuCatalog["prices"][number];
