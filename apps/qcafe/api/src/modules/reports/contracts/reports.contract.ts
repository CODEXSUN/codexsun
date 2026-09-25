import { z } from "zod";

export const reportScopeSchema = z.object({
  businessDayId: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  from: z.string().datetime({ offset: true }).optional(),
  locationId: z.string().uuid(),
  to: z.string().datetime({ offset: true }).optional(),
});

export const resolvedScopeSchema = z.object({
  businessDayId: z.string().uuid().nullable(),
  businessId: z.string().uuid(),
  from: z.string(),
  locationId: z.string().uuid(),
  to: z.string(),
});

export const reportResponseSchema = z.object({
  rows: z.array(z.record(z.unknown())),
  scope: resolvedScopeSchema,
  totals: z.record(z.unknown()),
});

export const alertsResponseSchema = z.object({
  alerts: z.array(
    z.object({
      detail: z.string(),
      subjectId: z.string(),
      subjectType: z.string(),
      type: z.string(),
    }),
  ),
  scope: resolvedScopeSchema,
});

export type ReportScope = z.infer<typeof reportScopeSchema>;
