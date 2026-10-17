import { z } from "zod";
export const enquirySchema = z.strictObject({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.email("Enter a valid email address.").max(254),
  company: z.string().trim().max(160),
  phone: z.string().trim().max(40),
  message: z
    .string()
    .trim()
    .min(10, "Please describe your requirement in at least 10 characters.")
    .max(5000),
  consent: z.literal(true, { error: "Please agree to the privacy notice." }),
  website: z.string().max(200)
});
export type EnquiryInput = z.infer<typeof enquirySchema>;

export const enquiryStatusSchema = z.enum(["new", "in_progress", "resolved", "spam"]);
export const enquiryRecordSchema = z.strictObject({
  reference: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  company: z.string(),
  phone: z.string(),
  message: z.string(),
  consentedAt: z.string(),
  createdAt: z.number(),
  updatedAt: z.string(),
  status: enquiryStatusSchema,
  revision: z.number().int(),
  deletedAt: z.string().nullable()
});
export const enquiryQuerySchema = z.strictObject({
  q: z.string().trim().max(180).default(""),
  status: z.union([enquiryStatusSchema, z.literal("all")]).default("all"),
  trash: z.enum(["yes", "no"]).default("no"),
  page: z.coerce.number().int().min(1).max(100000).default(1)
});
export const enquiryActivitySchema = z.strictObject({
  action: z.string(),
  actor: z.string(),
  at: z.string()
});
export const enquiryDetailSchema = enquiryRecordSchema.extend({
  activity: z.array(enquiryActivitySchema)
});
export const enquiryListSchema = z.strictObject({
  records: z.array(enquiryRecordSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number()
});
export const enquiryChangeSchema = z.strictObject({
  revision: z.number().int().positive(),
  status: enquiryStatusSchema
});
