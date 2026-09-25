import { z } from "zod";

export const marketplaceScopeSchema = z.object({
  businessId: z.string().uuid(),
  locationId: z.string().uuid(),
});

const adapterContractSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .refine(
    (value) => /^(zomato|swiggy|ubereats|generic-webhook)\.v\d+$/.test(value),
    "Use an official adapter contract such as zomato.v1.",
  );

export const registerPartnerSchema = z.object({
  adapterContract: adapterContractSchema,
  businessId: z.string().uuid(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
});

export const partnerIdSchema = z.object({ partnerId: z.string().uuid() });

export const mapMenuItemSchema = marketplaceScopeSchema.extend({
  menuItemId: z.string().uuid(),
  menuVariantId: z.string().uuid().optional(),
  partnerId: z.string().uuid(),
  partnerItemRef: z.string().trim().min(1).max(120),
});

export const intakeLineSchema = z.object({
  partnerItemRef: z.string().trim().min(1).max(120),
  quantity: z.number().int().positive().max(1_000),
  unitPriceMinor: z.number().int().min(0),
});

export const intakeOrderSchema = marketplaceScopeSchema.extend({
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  idempotencyKey: z.string().trim().min(1).max(120).optional(),
  lines: z.array(intakeLineSchema).min(1).max(50),
  partnerId: z.string().uuid(),
  partnerOrderRef: z.string().trim().min(1).max(120),
  totalMinor: z.number().int().min(0),
});

export const intakeIdSchema = z.object({ intakeId: z.string().uuid() });

export const rejectIntakeSchema = z.object({ reason: z.string().trim().min(3).max(500) });

export const linkOrderSchema = z.object({ orderId: z.string().uuid() });

export const recordFulfillmentSchema = z.object({
  partnerCollectedMinor: z.number().int().min(0),
  partnerFeeMinor: z.number().int().min(0),
  riderRef: z.string().trim().min(1).max(120).optional(),
});

export const recordSettlementSchema = marketplaceScopeSchema.extend({
  feeMinor: z.number().int().min(0),
  grossMinor: z.number().int().min(0),
  partnerId: z.string().uuid(),
  periodFrom: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
  periodTo: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
});

export const settlementIdSchema = z.object({ settlementId: z.string().uuid() });

export const marketplaceWorkspaceSchema = z.object({
  events: z.array(z.record(z.unknown())),
  fulfillments: z.array(z.record(z.unknown())),
  intakes: z.array(z.record(z.unknown())),
  intakeLines: z.array(z.record(z.unknown())),
  mappings: z.array(z.record(z.unknown())),
  partners: z.array(z.record(z.unknown())),
  settlements: z.array(z.record(z.unknown())),
});

export type MarketplaceScope = z.infer<typeof marketplaceScopeSchema>;
export type RegisterPartner = z.infer<typeof registerPartnerSchema>;
export type MapMenuItem = z.infer<typeof mapMenuItemSchema>;
export type IntakeOrder = z.infer<typeof intakeOrderSchema>;
export type RecordSettlement = z.infer<typeof recordSettlementSchema>;
