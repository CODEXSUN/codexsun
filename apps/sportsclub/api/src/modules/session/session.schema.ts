import { z } from "zod";

export const publicSessionSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  title: z.string().trim().min(2).max(160),
  programUuid: z.string().regex(/^[a-f0-9]{8}$/),
  masterUuid: z.string().regex(/^[a-f0-9]{8}$/).nullable(),
  daysOfWeek: z.string().trim().max(64),
  startTime: z.string().trim().max(8),
  endTime: z.string().trim().max(8),
  venue: z.string().trim().max(160)
});

export const sessionPayloadSchema = z.strictObject({
  title: z.string().trim().min(2).max(160),
  programUuid: z.string().regex(/^[a-f0-9]{8}$/),
  masterUuid: z.string().regex(/^[a-f0-9]{8}$/).nullable().default(null),
  daysOfWeek: z.string().trim().max(64),
  startTime: z.string().trim().max(8),
  endTime: z.string().trim().max(8),
  venue: z.string().trim().max(160),
  maxCapacity: z.number().int().min(1).max(500).default(30),
  isApprovedPublic: z.boolean().default(true),
  status: z.enum(["active", "cancelled"]).default("active"),
  revision: z.number().int().min(0)
});

export const sessionRecordSchema = sessionPayloadSchema.extend({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  createdAt: z.string(),
  updatedAt: z.string()
});

import {
  baseListQuerySchema,
  createListResponseSchema
} from "../../sportsclub.pagination.js";

export const sessionSelectableColumns = [
  "uuid",
  "title",
  "programUuid",
  "masterUuid",
  "daysOfWeek",
  "startTime",
  "endTime",
  "venue",
  "maxCapacity",
  "isApprovedPublic",
  "status",
  "revision",
  "createdAt",
  "updatedAt"
] as const;

export const sessionListQuerySchema = baseListQuerySchema.extend({
  title: z.string().trim().max(160).optional(),
  venue: z.string().trim().max(160).optional(),
  daysOfWeek: z.string().trim().max(64).optional(),
  programUuid: z.string().optional(),
  masterUuid: z.string().optional(),
  status: z.enum(["active", "cancelled"]).optional()
});

export const sessionListResponseSchema = createListResponseSchema(sessionRecordSchema);
