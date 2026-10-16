import { z } from "zod";

export const callLogSchema = z.object({
  type: z.enum(["Incoming", "Outgoing"]),
  from: z.string().trim().min(1, "Enter the caller number."),
  to: z.string().trim().min(1, "Enter the recipient number."),
  status: z.string().min(1, "Choose a status."),
  duration: z.number().int().min(0, "Duration cannot be negative."),
  user: z.string().nullable()
});
