import { z } from "zod";
import { pageContentSchema } from "../page/page.schema.js";
import { blogContentSchema } from "../blog/blog.schema.js";

export const deliveryPayloadSchema = z.strictObject({
  schemaVersion: z.literal(1),
  siteKey: z.string().regex(/^[a-f0-9]{64}$/),
  siteUuid: z.string().regex(/^[a-f0-9]{8}$/),
  siteSlug: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,119}$/),
  content: pageContentSchema,
  blogs: z.array(blogContentSchema).max(500)
});
export const deliverySnapshotSchema = deliveryPayloadSchema.extend({
  sequence: z.number().int().positive(),
  publishedAt: z.iso.datetime(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/)
});
export type DeliveryPayload = z.infer<typeof deliveryPayloadSchema>;
export type DeliverySnapshot = z.infer<typeof deliverySnapshotSchema>;
