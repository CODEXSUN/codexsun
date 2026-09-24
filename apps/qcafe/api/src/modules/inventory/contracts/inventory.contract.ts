import { z } from "zod";

export const inventoryScopeSchema = z.object({
  businessId: z.string().uuid(),
  locationId: z.string().uuid(),
});

export const createStockUnitSchema = inventoryScopeSchema.extend({
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  symbol: z.string().trim().min(1).max(20).optional(),
});

export const createStockItemSchema = inventoryScopeSchema.extend({
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(160),
  reorderLevelMilli: z.number().int().min(0).default(0),
  trackStock: z.boolean().default(true),
  unitId: z.string().uuid(),
});

export const stockAdjustmentLineSchema = z.object({
  quantityMilli: z
    .number()
    .int()
    .refine((value) => value !== 0, "Quantity cannot be zero."),
  stockItemId: z.string().uuid(),
});

export const postStockAdjustmentSchema = inventoryScopeSchema.extend({
  approvedBy: z.string().trim().min(1).max(120).optional(),
  lines: z.array(stockAdjustmentLineSchema).min(1).max(50),
  reason: z.string().trim().min(3).max(500),
});

export const inventoryWorkspaceSchema = z.object({
  adjustments: z.array(z.record(z.unknown())),
  balances: z.array(z.record(z.unknown())),
  items: z.array(z.record(z.unknown())),
  movements: z.array(z.record(z.unknown())),
  planLines: z.array(z.record(z.unknown())),
  plans: z.array(z.record(z.unknown())),
  recipeComponents: z.array(z.record(z.unknown())),
  recipes: z.array(z.record(z.unknown())),
  units: z.array(z.record(z.unknown())),
});

export const recipeComponentSchema = z.object({
  note: z.string().trim().min(1).max(240).optional(),
  quantityMilli: z.number().int().positive(),
  stockItemId: z.string().uuid(),
});

const recipeDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

export const createRecipeSchema = inventoryScopeSchema.extend({
  changeReason: z.string().trim().min(3).max(500).optional(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  components: z.array(recipeComponentSchema).min(1).max(50),
  effectiveFrom: recipeDateSchema,
  effectiveTo: recipeDateSchema.optional(),
  menuItemId: z.string().uuid(),
  menuVariantId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
});

export const reviseRecipeSchema = z.object({
  changeReason: z.string().trim().min(3).max(500),
  components: z.array(recipeComponentSchema).min(1).max(50).optional(),
  effectiveFrom: recipeDateSchema,
  effectiveTo: recipeDateSchema.optional(),
});

export const recipeIdSchema = z.object({ recipeId: z.string().uuid() });

export const createDailyPlanSchema = inventoryScopeSchema.extend({
  note: z.string().trim().min(1).max(500).optional(),
  planDate: recipeDateSchema,
});

export const addDailyPlanLineSchema = z.object({
  demandRef: z.string().trim().min(1).max(120).optional(),
  demandSource: z.enum(["regular", "special", "booking", "event"]),
  menuItemId: z.string().uuid(),
  menuVariantId: z.string().uuid().optional(),
  note: z.string().trim().min(1).max(240).optional(),
  quantityMilli: z.number().int().positive(),
});

export const dailyPlanIdSchema = z.object({ planId: z.string().uuid() });

export type InventoryScope = z.infer<typeof inventoryScopeSchema>;
export type CreateStockUnit = z.infer<typeof createStockUnitSchema>;
export type CreateStockItem = z.infer<typeof createStockItemSchema>;
export type PostStockAdjustment = z.infer<typeof postStockAdjustmentSchema>;
export type CreateRecipe = z.infer<typeof createRecipeSchema>;
export type ReviseRecipe = z.infer<typeof reviseRecipeSchema>;
export type CreateDailyPlan = z.infer<typeof createDailyPlanSchema>;
export type AddDailyPlanLine = z.infer<typeof addDailyPlanLineSchema>;
