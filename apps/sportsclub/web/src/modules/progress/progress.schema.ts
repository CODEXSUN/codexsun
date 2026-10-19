import { z } from "zod";

export const progressSchema = z.object({
  memberUuid: z.string().trim().min(1, "Student member selection is required"),
  masterUuid: z.string().trim().min(1, "Evaluating master / asan is required"),
  stageLevel: z.string().trim().min(1, "Target stage / belt level is required"),
  assessmentDate: z.string().trim().min(1, "Assessment date is required"),
  status: z.enum(["eligible", "in_progress", "passed", "retry"]),
  certificateNo: z.string().nullable().optional(),
  evaluationNotes: z.string().nullable().optional()
});

export type ProgressSchemaType = z.infer<typeof progressSchema>;
