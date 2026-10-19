import { z } from "zod";

export const programSchema = z.strictObject({
  code: z.string().trim().min(2, "Program code is required (min 2 chars)").max(32),
  name: z.string().trim().min(2, "Program name is required (min 2 chars)").max(160),
  discipline: z.string().trim().min(2, "Discipline is required").max(120),
  description: z.string().trim().max(3000),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]),
  ageGroup: z.string().trim().max(80),
  isApprovedPublic: z.boolean().default(true),
  status: z.enum(["active", "inactive"]),
  sortOrder: z.coerce.number().int().min(0).default(0),
  revision: z.coerce.number().int().min(0).default(0)
});

export type ProgramSchemaType = z.infer<typeof programSchema>;
