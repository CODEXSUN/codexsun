import { z } from "zod";
export const eventSchema = z.strictObject({
  title: z.string().trim().min(2).max(160),
  eventType: z.enum(["demonstration", "tournament", "workshop", "camp"]),
  description: z.string().trim().max(3000),
  eventDate: z.string().trim().min(1).max(24),
  endDate: z.string().trim().max(24).nullable(),
  location: z.string().trim().min(1).max(200),
  isApprovedPublic: z.boolean(),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]),
  revision: z.number().int().min(0)
});
export type EventSchemaType = z.infer<typeof eventSchema>;
