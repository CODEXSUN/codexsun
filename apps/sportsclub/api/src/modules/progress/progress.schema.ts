import { z } from "zod";

export const progressEvaluationInputSchema = z.strictObject({
  stageLevel: z.string().trim().min(2).max(120),
  score: z.number().int().min(0).max(100).nullable().default(null),
  assessment: z.string().trim().min(2).max(3000),
  privateNotes: z.string().trim().max(3000).default(""),
  status: z.enum(["in_progress", "passed", "recommended"]).default("in_progress"),
  programUuid: z.string().regex(/^[a-f0-9]{8}$/).nullable().default(null),
  revision: z.number().int().min(0)
});

export const progressPayloadSchema = progressEvaluationInputSchema.extend({
  memberUuid: z.string().regex(/^[a-f0-9]{8}$/),
  masterUuid: z.string().regex(/^[a-f0-9]{8}$/)
});

export const progressRecordSchema = progressPayloadSchema.extend({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  gradedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const studentProgressViewSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  memberUuid: z.string().regex(/^[a-f0-9]{8}$/),
  masterUuid: z.string().regex(/^[a-f0-9]{8}$/),
  programUuid: z.string().regex(/^[a-f0-9]{8}$/).nullable(),
  stageLevel: z.string(),
  score: z.number().nullable(),
  assessment: z.string(),
  status: z.enum(["in_progress", "passed", "recommended"]),
  gradedAt: z.string()
});

import {
  baseListQuerySchema,
  createListResponseSchema
} from "../../sportsclub.pagination.js";

export const progressSelectableColumns = [
  "uuid",
  "memberUuid",
  "masterUuid",
  "programUuid",
  "stageLevel",
  "score",
  "assessment",
  "privateNotes",
  "status",
  "gradedAt",
  "revision",
  "createdAt",
  "updatedAt"
] as const;

export const progressListQuerySchema = baseListQuerySchema.extend({
  memberUuid: z.string().optional(),
  masterUuid: z.string().optional(),
  programUuid: z.string().optional(),
  stageLevel: z.string().trim().optional(),
  status: z.enum(["in_progress", "passed", "recommended"]).optional()
});

export const progressListResponseSchema = createListResponseSchema(progressRecordSchema);
