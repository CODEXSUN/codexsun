import type { z } from "zod";
import type {
  progressEvaluationInputSchema,
  progressListQuerySchema,
  progressListResponseSchema,
  progressPayloadSchema,
  progressRecordSchema,
  progressSelectableColumns,
  studentProgressViewSchema
} from "./progress.schema.js";

export type ProgressPayload = z.infer<typeof progressPayloadSchema>;
export type ProgressRecord = z.infer<typeof progressRecordSchema>;
export type ProgressEvaluationInput = z.infer<typeof progressEvaluationInputSchema>;
export type StudentProgressView = z.infer<typeof studentProgressViewSchema>;
export type ProgressSelectableColumn = (typeof progressSelectableColumns)[number];
export type ProgressListQuery = z.input<typeof progressListQuerySchema>;
export type ProgressListResponse = z.infer<typeof progressListResponseSchema>;
