import { z } from "zod";

export const publicMasterSchema = z.strictObject({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  name: z.string().trim().min(2).max(160),
  title: z.string().trim().min(2).max(120),
  primaryDiscipline: z.string().trim().min(2).max(120),
  publicBio: z.string().trim().max(3000),
  experienceYears: z.number().int().min(0).max(80)
});

export const masterPayloadSchema = z.strictObject({
  email: z.string().email().trim().toLowerCase().max(254),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(32),
  title: z.string().trim().min(2).max(120),
  primaryDiscipline: z.string().trim().min(2).max(120),
  publicBio: z.string().trim().max(3000),
  privateNotes: z.string().trim().max(3000),
  experienceYears: z.number().int().min(0).max(80),
  isApprovedPublic: z.boolean(),
  status: z.enum(["active", "suspended"]),
  sortOrder: z.number().int().min(0),
  revision: z.number().int().min(0)
});

export const masterRecordSchema = masterPayloadSchema.extend({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  createdAt: z.string(),
  updatedAt: z.string()
});

import {
  baseListQuerySchema,
  createListResponseSchema
} from "../../sportsclub.pagination.js";

export const masterSelectableColumns = [
  "uuid",
  "email",
  "name",
  "phone",
  "title",
  "primaryDiscipline",
  "publicBio",
  "privateNotes",
  "experienceYears",
  "isApprovedPublic",
  "status",
  "sortOrder",
  "revision",
  "createdAt",
  "updatedAt"
] as const;

export const masterListQuerySchema = baseListQuerySchema.extend({
  name: z.string().trim().max(160).optional(),
  email: z.string().trim().max(254).optional(),
  phone: z.string().trim().max(32).optional(),
  title: z.string().trim().max(120).optional(),
  primaryDiscipline: z.string().trim().optional(),
  status: z.enum(["active", "suspended"]).optional(),
  isApprovedPublic: z.coerce.boolean().optional()
});

export const masterListResponseSchema = createListResponseSchema(masterRecordSchema);
