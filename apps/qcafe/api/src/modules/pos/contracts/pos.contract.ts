import { z } from "zod";
export const posScopeSchema = z.object({ businessId: z.string().uuid(), locationId: z.string().uuid() });
export const createOrderSchema = posScopeSchema.extend({
  serviceChannelId: z.string().uuid(),
  priceBookId: z.string().uuid(),
  tableSessionId: z.string().uuid().optional(),
  customerName: z.string().trim().max(160).optional(),
  contactRef: z.string().trim().max(160).optional(),
  collectionName: z.string().trim().max(160).optional(),
  pickupWindow: z.string().datetime({ offset: true }).optional(),
  note: z.string().trim().max(1000).optional(),
});
export const addOrderLineSchema = z.object({
  itemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().positive().max(100),
  note: z.string().trim().max(500).optional(),
  modifiers: z
    .array(z.object({ optionId: z.string().uuid(), quantity: z.number().int().positive().max(20) }))
    .default([]),
});
export const changeOrderLineSchema = z.object({
  note: z.string().trim().max(500).nullable().optional(),
  quantity: z.number().positive().max(100),
});
export const orderActionSchema = z.object({ reason: z.string().trim().max(500).optional() });
export const orderAdjustmentSchema = z.object({
  amountMinor: z.number().int().positive(),
  kind: z.enum(["discount", "service_recovery", "rounding"]),
  reason: z.string().trim().min(3).max(500),
});
export const orderNoteSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  lineId: z.string().uuid().optional(),
  noteKind: z.enum(["guest", "internal", "kitchen"]),
  visibility: z.enum(["guest", "internal", "kitchen"]),
});
export const orderIdSchema = z.object({ orderId: z.string().uuid() });
export const orderLineIdSchema = orderIdSchema.extend({ lineId: z.string().uuid() });
export const posWorkspaceSchema = z.object({
  orders: z.array(z.record(z.unknown())),
  lines: z.array(z.record(z.unknown())),
  modifiers: z.array(z.record(z.unknown())),
  events: z.array(z.record(z.unknown())),
  fulfillments: z.array(z.record(z.unknown())),
  takeawayDetails: z.array(z.record(z.unknown())),
  adjustments: z.array(z.record(z.unknown())),
  notes: z.array(z.record(z.unknown())),
});
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type AddOrderLine = z.infer<typeof addOrderLineSchema>;
export type PosScope = z.infer<typeof posScopeSchema>;
