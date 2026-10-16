import { z } from "zod";
export const blogContentSchema = z.strictObject({
  title: z.string().trim().min(1).max(180),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(120),
  summary: z.string().trim().min(1).max(500),
  body: z.string().trim().min(1).max(50000)
});
export type BlogContent = z.infer<typeof blogContentSchema>;
export const blogRecordSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  content: blogContentSchema,
  revision: z.number().int().positive(),
  publishedRevision: z.number().int().nonnegative()
});
export type BlogRecord = z.infer<typeof blogRecordSchema>;
export const blogSaveSchema = z.strictObject({
  content: blogContentSchema,
  revision: z.number().int().nonnegative()
});
