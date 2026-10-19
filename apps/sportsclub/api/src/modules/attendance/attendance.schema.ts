import { z } from "zod";

export const attendancePayloadSchema = z.strictObject({
  sessionUuid: z.string().regex(/^[a-f0-9]{8}$/),
  memberUuid: z.string().regex(/^[a-f0-9]{8}$/),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
  status: z.enum(["present", "absent", "excused", "late"]),
  remarks: z.string().trim().max(500).default("")
});

export const attendanceRecordSchema = attendancePayloadSchema.extend({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  recordedBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

import {
  baseListQuerySchema,
  createListResponseSchema
} from "../../sportsclub.pagination.js";

export const attendanceSelectableColumns = [
  "uuid",
  "sessionUuid",
  "memberUuid",
  "attendanceDate",
  "status",
  "remarks",
  "recordedBy",
  "createdAt",
  "updatedAt"
] as const;

export const attendanceListQuerySchema = baseListQuerySchema.extend({
  sessionUuid: z.string().optional(),
  memberUuid: z.string().optional(),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["present", "absent", "excused", "late"]).optional()
});

export const attendanceListResponseSchema = createListResponseSchema(attendanceRecordSchema);
