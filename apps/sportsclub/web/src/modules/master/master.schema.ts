import { z } from "zod";

export const masterSchema = z.strictObject({
  email: z.string().email("A valid email is required").trim().toLowerCase().max(254),
  name: z.string().trim().min(2, "Master name must be at least 2 characters").max(160),
  phone: z.string().trim().max(32).default(""),
  title: z.string().trim().min(2, "Title or designation is required").max(120),
  primaryDiscipline: z.string().trim().min(2, "Primary discipline is required").max(120),
  publicBio: z.string().trim().max(3000).default(""),
  privateNotes: z.string().trim().max(3000).default(""),
  experienceYears: z.coerce.number().int().min(0, "Experience must be 0 or more years").max(80).default(0),
  isApprovedPublic: z.boolean().default(false),
  status: z.enum(["active", "suspended"]).default("active"),
  sortOrder: z.coerce.number().int().min(0).default(0),
  revision: z.coerce.number().int().min(0).default(0)
});

export type MasterSchemaType = z.infer<typeof masterSchema>;
