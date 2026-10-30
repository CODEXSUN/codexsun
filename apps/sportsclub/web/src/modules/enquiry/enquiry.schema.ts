import { z } from "zod";
export const enquirySchema = z.strictObject({
  name: z.string().trim().min(2).max(160),
  email: z.string().email().trim().toLowerCase().max(254),
  phone: z.string().trim().max(32),
  interest: z.string().trim().max(120),
  message: z.string().trim().max(3000),
  consent: z.boolean(),
  status: z.enum(["new", "in_progress", "resolved", "spam", "trash"]),
  notes: z.string().trim().max(2000),
  revision: z.number().int().min(0)
});
export type EnquirySchemaType = z.infer<typeof enquirySchema>;
