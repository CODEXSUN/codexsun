import { z } from "zod";

export const sessionSchema = z.object({
  title: z.string().trim().min(2, "Batch / Session title is required").max(120),
  programUuid: z.string().trim().min(1, "Program discipline selection is required"),
  masterUuid: z.string().trim().min(1, "Assigned instructor / asan is required"),
  dayOfWeek: z.string().trim().min(2, "Training days are required (e.g. Mon, Wed, Fri)"),
  startTime: z.string().trim().min(2, "Start time is required"),
  endTime: z.string().trim().min(2, "End time is required"),
  venue: z.string().trim().min(2, "Training ground or hall venue is required"),
  maxCapacity: z.number().int().min(1, "Capacity must be at least 1").max(500),
  status: z.enum(["active", "inactive"])
});

export type SessionSchemaType = z.infer<typeof sessionSchema>;
