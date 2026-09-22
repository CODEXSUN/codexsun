import { z } from "zod";
export const tableScopeSchema = z.object({ businessId: z.string().uuid(), locationId: z.string().uuid() });
export const createAreaSchema = tableScopeSchema.extend({
  name: z.string().trim().min(2).max(120),
  kind: z.enum(["dining", "bar", "terrace", "private"]),
  sortOrder: z.number().int().min(0).default(0),
});
export const createTableSchema = tableScopeSchema.extend({
  areaId: z.string().uuid(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((v) => v.toUpperCase()),
  capacity: z.number().int().positive().max(100),
  positionLabel: z.string().trim().max(80).optional(),
});
export const openTableSessionSchema = tableScopeSchema.extend({
  tableIds: z.array(z.string().uuid()).min(1),
  guestCount: z.number().int().positive().max(500),
});
export const sessionIdSchema = z.object({ sessionId: z.string().uuid() });
export const tableWorkspaceSchema = z.object({
  areas: z.array(z.record(z.unknown())),
  tables: z.array(z.record(z.unknown())),
  sessions: z.array(z.record(z.unknown())),
  sessionTables: z.array(z.record(z.unknown())),
});
