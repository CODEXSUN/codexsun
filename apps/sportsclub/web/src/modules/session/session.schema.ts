import { z } from "zod";

export const sessionSchema = z.strictObject({
  title: z.string().trim().min(2, "Batch title must be at least 2 characters").max(160),
  programUuid: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{8}$/, "Please select a valid curriculum program"),
  masterUuid: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val !== "none" && val.trim() !== "" ? val.trim() : null))
    .refine((val) => val === null || /^[a-f0-9]{8}$/.test(val), {
      message: "Please select a valid instructor"
    }),
  daysOfWeek: z
    .string()
    .trim()
    .min(2, "Training days are required (e.g. Mon, Wed, Fri)")
    .max(64),
  startTime: z.string().trim().min(2, "Start time is required").max(8),
  endTime: z.string().trim().min(2, "End time is required").max(8),
  venue: z.string().trim().min(2, "Venue location is required").max(160),
  maxCapacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(500).default(30),
  isApprovedPublic: z.boolean().default(true),
  status: z.enum(["active", "cancelled"]).default("active"),
  revision: z.coerce.number().int().min(0).default(0)
});

export type SessionSchemaType = z.infer<typeof sessionSchema>;
