import { z } from "zod";

export const publicEventSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  title: z.string().trim().min(2).max(160),
  eventType: z.enum(["demonstration", "tournament", "workshop", "camp"]),
  description: z.string().trim().max(3000),
  eventDate: z.string().trim().max(24),
  endDate: z.string().trim().max(24).nullable(),
  location: z.string().trim().max(200)
});

export const eventPayloadSchema = z.strictObject({
  title: z.string().trim().min(2).max(160),
  eventType: z.enum(["demonstration", "tournament", "workshop", "camp"]),
  description: z.string().trim().max(3000),
  eventDate: z.string().trim().max(24),
  endDate: z.string().trim().max(24).nullable().default(null),
  location: z.string().trim().max(200),
  isApprovedPublic: z.boolean().default(true),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).default("upcoming"),
  revision: z.number().int().min(0)
});

export const eventRecordSchema = eventPayloadSchema.extend({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  createdAt: z.string(),
  updatedAt: z.string()
});
