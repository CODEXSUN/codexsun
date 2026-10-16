import { z } from "zod";

export const sitePayloadSchema = z.strictObject({
  description: z.string().max(255).optional(),
  name: z.string().min(1, "Name is required").max(160),
  port: z.number().int().min(0).max(65535).optional(),
  primaryDomain: z.string().min(1, "Primary domain is required").max(255),
  slug: z.string().min(1, "Slug is required").max(120),
  themeKey: z.string().min(1, "Theme key is required").max(120)
});
