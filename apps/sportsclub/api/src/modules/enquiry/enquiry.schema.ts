import { z } from "zod";

export const publicEnquirySubmissionSchema = z.strictObject({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(160),
  email: z.string().email("A valid email is required.").trim().toLowerCase().max(254),
  phone: z.string().trim().max(32).default(""),
  interest: z.string().trim().max(120).default("Silambam Training"),
  message: z.string().trim().min(5, "Message must be at least 5 characters.").max(3000),
  consent: z.literal(true, {
    message: "You must accept the privacy policy to submit."
  }),
  website: z.string().max(0).optional()
});

export const enquiryPayloadSchema = z.strictObject({
  name: z.string().trim().min(2).max(160),
  email: z.string().email().trim().toLowerCase().max(254),
  phone: z.string().trim().max(32).default(""),
  interest: z.string().trim().max(120),
  message: z.string().trim().max(3000),
  consent: z.boolean(),
  status: z.enum(["new", "in_progress", "resolved", "spam", "trash"]).default("new"),
  notes: z.string().trim().max(2000).default(""),
  revision: z.number().int().min(0)
});

export const enquiryRecordSchema = enquiryPayloadSchema.extend({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  createdAt: z.string(),
  updatedAt: z.string()
});

import {
  baseListQuerySchema,
  createListResponseSchema
} from "../../sportsclub.pagination.js";

export const enquirySelectableColumns = [
  "uuid",
  "name",
  "email",
  "phone",
  "interest",
  "message",
  "consent",
  "status",
  "notes",
  "revision",
  "createdAt",
  "updatedAt"
] as const;

export const enquiryListQuerySchema = baseListQuerySchema.extend({
  status: z.enum(["new", "in_progress", "resolved", "spam", "trash"]).optional()
});

export const enquiryListResponseSchema = createListResponseSchema(enquiryRecordSchema);
