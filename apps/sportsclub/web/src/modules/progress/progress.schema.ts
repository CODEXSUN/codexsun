import { z } from "zod";
export const progressSchema = z.strictObject({
  memberUuid: z.string().regex(/^[a-f0-9]{8}$/, "Choose a member"),
  stageLevel: z.string().trim().min(2).max(120),
  score: z.number().int().min(0).max(100).nullable(),
  assessment: z.string().trim().min(2).max(3000),
  privateNotes: z.string().trim().max(3000),
  status: z.enum(["in_progress", "passed", "recommended"]),
  programUuid: z
    .string()
    .regex(/^[a-f0-9]{8}$/)
    .nullable(),
  revision: z.number().int().min(0)
});
export type ProgressSchemaType = z.infer<typeof progressSchema>;
