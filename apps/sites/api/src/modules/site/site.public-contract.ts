import { z } from "zod";
import { pageContentSchema } from "./page/page.schema.js";
import { blogContentSchema } from "./blog/blog.schema.js";
export const sitePublicationSchema = z.strictObject({
  siteUuid: z.string().regex(/^[a-f0-9]{8}$/),
  siteSlug: z.string().min(1).max(120),
  content: pageContentSchema.nullable(),
  blogs: z.array(blogContentSchema)
});
export type SitePublication = z.infer<typeof sitePublicationSchema>;
