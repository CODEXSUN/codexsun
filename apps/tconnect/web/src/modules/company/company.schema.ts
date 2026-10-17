import { z } from "zod";
export const companyInput = z
  .object({
    logoDataUrl: z
      .string()
      .max(210000)
      .regex(/^(?:data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2})?$/)
      .default(""),
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
    role: z.enum(["manufacturer", "supplier", "buyer", "service"]),
    products: z.string().trim().min(2).max(1000),
    capacity: z.string().trim().max(240),
    established: z.number().int().min(1900).max(2100),
    associationUuid: z
      .string()
      .regex(/^[0-9a-f]{8}$/)
      .nullable(),
    website: z.union([
      z.literal(""),
      z
        .url()
        .max(500)
        .regex(/^https?:\/\//)
    ]),
    status: z.enum(["active", "inactive"]).default("active")
  })
  .strict();
