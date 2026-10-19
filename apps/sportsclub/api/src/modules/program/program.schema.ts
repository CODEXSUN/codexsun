import { z } from "zod";

export const publicProgramSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  code: z.string().trim().min(2).max(32),
  name: z.string().trim().min(2).max(160),
  discipline: z.string().trim().min(2).max(120),
  description: z.string().trim().max(3000),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]),
  ageGroup: z.string().trim().max(80)
});

export const programPayloadSchema = z.strictObject({
  code: z.string().trim().min(2).max(32),
  name: z.string().trim().min(2).max(160),
  discipline: z.string().trim().min(2).max(120),
  description: z.string().trim().max(3000),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]),
  ageGroup: z.string().trim().max(80),
  isApprovedPublic: z.boolean(),
  status: z.enum(["active", "inactive"]),
  sortOrder: z.number().int().min(0),
  revision: z.number().int().min(0)
});

export const programRecordSchema = programPayloadSchema.extend({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  createdAt: z.string(),
  updatedAt: z.string()
});

import {
  baseListQuerySchema,
  createListResponseSchema
} from "../../sportsclub.pagination.js";

export const programSelectableColumns = [
  "uuid",
  "code",
  "name",
  "discipline",
  "description",
  "level",
  "ageGroup",
  "isApprovedPublic",
  "status",
  "sortOrder",
  "revision",
  "createdAt",
  "updatedAt"
] as const;

export const programListQuerySchema = baseListQuerySchema.extend({
  code: z.string().trim().max(32).optional(),
  name: z.string().trim().max(160).optional(),
  ageGroup: z.string().trim().max(80).optional(),
  discipline: z.string().trim().optional(),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export const programListResponseSchema = createListResponseSchema(programRecordSchema);
