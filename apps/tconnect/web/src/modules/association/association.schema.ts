import { z } from "zod";
export const associationInput = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(160),
    tagline: z.string().trim().max(240),
    description: z.string().trim().min(10).max(5000),
    industry: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(100),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    initials: z.string().trim().min(1).max(4),
    status: z.enum(["active", "inactive"]).default("active")
  })
  .strict();
