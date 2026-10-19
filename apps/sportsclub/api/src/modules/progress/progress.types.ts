import type { z } from "zod";
import type {
  progressEvaluationInputSchema,
  progressPayloadSchema,
  progressRecordSchema,
  studentProgressViewSchema
} from "./progress.schema.js";

export type ProgressPayload = z.infer<typeof progressPayloadSchema>;
export type ProgressRecord = z.infer<typeof progressRecordSchema>;
export type ProgressEvaluationInput = z.infer<typeof progressEvaluationInputSchema>;
export type StudentProgressView = z.infer<typeof studentProgressViewSchema>;
