import { z } from "zod";

export const sitePayloadSchema = z.strictObject({
  description: z.string().max(255).optional(),
  name: z.string().min(1, "Name is required").max(160),
  port: z.number().int().min(1024, "Use a port from 1024 to 65535").max(65535),
  primaryDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/,
      "Enter a domain without https:// or a path"
    )
    .max(255),
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9_-]{0,119}$/, "Use lowercase letters, numbers, hyphens or underscores"),
  themeKey: z.string().min(1, "Theme key is required").max(120)
});
