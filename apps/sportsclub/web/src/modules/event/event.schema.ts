import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().trim().min(2, "Event title is required").max(140),
  eventType: z.enum(["tournament", "demonstration", "workshop", "camp"]),
  eventDate: z.string().trim().min(1, "Event date is required"),
  venue: z.string().trim().min(2, "Venue location is required"),
  description: z.string().trim().min(5, "Event description must be at least 5 characters"),
  isApprovedPublic: z.boolean().default(true),
  status: z.enum(["upcoming", "completed", "cancelled"])
});

export type EventSchemaType = z.infer<typeof eventSchema>;
