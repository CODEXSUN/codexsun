import { z } from "zod";

export const programSchema = z.object({
  title: z.string().trim().min(2, "Discipline title is required").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  category: z.enum(["silambam", "varma", "traditional", "fitness"]),
  skillLevels: z.string().trim().min(2, "Skill levels description is required"),
  isApprovedPublic: z.boolean().default(true),
  status: z.enum(["active", "inactive"])
});

export type ProgramSchemaType = z.infer<typeof programSchema>;
