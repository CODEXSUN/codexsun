import { z } from "zod";
export const kitchenScopeSchema = z.object({ businessId: z.string().uuid(), locationId: z.string().uuid() });
export const createStationSchema = kitchenScopeSchema.extend({
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2).max(120),
});
export const createRouteSchema = kitchenScopeSchema.extend({
  itemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  stationId: z.string().uuid(),
  priority: z.number().int().min(0).default(0),
});
export const ticketIdSchema = z.object({ ticketId: z.string().uuid() });
export const ticketActionSchema = z.object({
  action: z.enum(["accept", "prepare", "ready", "serve", "recall", "void"]),
  note: z.string().trim().max(500).optional(),
});
export const printTicketSchema = z.object({ routeRef: z.string().trim().min(1).max(160) });
export const kitchenWorkspaceSchema = z.object({
  stations: z.array(z.record(z.unknown())),
  routes: z.array(z.record(z.unknown())),
  tickets: z.array(z.record(z.unknown())),
  lines: z.array(z.record(z.unknown())),
  events: z.array(z.record(z.unknown())),
  printAttempts: z.array(z.record(z.unknown())),
});
