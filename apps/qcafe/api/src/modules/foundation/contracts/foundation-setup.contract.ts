import { z } from "zod";

export const createBusinessSetupSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  currency: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toUpperCase()),
  legalName: z.string().trim().max(200).optional(),
  locationCode: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((value) => value.toUpperCase()),
  locationName: z.string().trim().min(2).max(160),
  timezone: z.string().trim().min(3).max(80),
});

export const createLocationSchema = z.object({
  businessId: z.string().uuid(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(160),
  timezone: z.string().trim().min(3).max(80),
});

export const openBusinessDaySchema = z.object({
  businessDate: z.string().date(),
});

const serviceChannelSchema = z.object({
  code: z.string(),
  enabled: z.boolean(),
  id: z.string(),
  kind: z.enum(["counter", "dine_in", "takeaway", "qr", "delivery", "event", "marketplace"]),
  name: z.string(),
});

const numberSequenceSchema = z.object({
  documentKind: z.enum(["bill", "kot", "order"]),
  id: z.string(),
  nextValue: z.number().int().positive(),
  prefix: z.string(),
});

const businessDaySchema = z.object({
  businessDate: z.string(),
  closedAt: z.string().nullable(),
  id: z.string(),
  openedAt: z.string(),
  status: z.enum(["open", "closed"]),
});

export const locationSetupSchema = z.object({
  businessDay: businessDaySchema.nullable(),
  businessId: z.string(),
  code: z.string(),
  id: z.string(),
  name: z.string(),
  numberSequences: z.array(numberSequenceSchema),
  serviceChannels: z.array(serviceChannelSchema),
  status: z.enum(["active", "inactive"]),
  timezone: z.string(),
});

export const businessSetupSchema = z.object({
  currency: z.string(),
  id: z.string(),
  legalName: z.string().nullable(),
  locations: z.array(locationSetupSchema),
  name: z.string(),
  timezone: z.string(),
});

export const foundationSetupResponseSchema = z.object({
  businesses: z.array(businessSetupSchema),
  dataMode: z.enum(["cloud", "local"]),
  syncConfigured: z.boolean(),
});

export const foundationSetupErrorSchema = z.object({ error: z.string() });

export type BusinessSetup = z.infer<typeof businessSetupSchema>;
export type CreateBusinessSetup = z.infer<typeof createBusinessSetupSchema>;
export type CreateLocation = z.infer<typeof createLocationSchema>;
export type FoundationSetupResponse = z.infer<typeof foundationSetupResponseSchema>;
export type LocationSetup = z.infer<typeof locationSetupSchema>;
