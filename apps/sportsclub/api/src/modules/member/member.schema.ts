import { z } from "zod";

export const studentEnrollmentSchema = z.strictObject({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(160),
  email: z.string().email("A valid email is required.").trim().toLowerCase().max(254),
  phone: z.string().trim().max(32).default(""),
  dateOfBirth: z.string().trim().max(16).nullable().optional(),
  gender: z.string().trim().max(16).nullable().optional(),
  guardianName: z.string().trim().max(160).nullable().optional(),
  guardianPhone: z.string().trim().max(32).nullable().optional(),
  emergencyContact: z.string().trim().max(32).nullable().optional(),
  medicalNotes: z.string().trim().max(1000).optional().default(""),
  address: z.string().trim().max(255).optional().default(""),
  programUuid: z.string().regex(/^[a-f0-9]{8}$/).nullable().optional()
});

export const memberPayloadSchema = z.strictObject({
  email: z.string().email().trim().toLowerCase().max(254),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(32).default(""),
  dateOfBirth: z.string().trim().max(16).nullable().default(null),
  gender: z.string().trim().max(16).nullable().default(null),
  guardianName: z.string().trim().max(160).nullable().default(null),
  guardianPhone: z.string().trim().max(32).nullable().default(null),
  emergencyContact: z.string().trim().max(32).nullable().default(null),
  medicalNotes: z.string().trim().max(1000).default(""),
  address: z.string().trim().max(255).default(""),
  programUuid: z.string().regex(/^[a-f0-9]{8}$/).nullable().default(null),
  masterUuid: z.string().regex(/^[a-f0-9]{8}$/).nullable().default(null),
  role: z.enum(["student", "master"]).default("student"),
  status: z.enum(["pending", "active", "suspended", "graduated"]).default("pending"),
  progressNote: z.string().trim().max(2000).default(""),
  revision: z.number().int().min(0)
});

export const memberRecordSchema = memberPayloadSchema.extend({
  uuid: z.string().regex(/^[a-f0-9]{8}$/),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const memberActivitySchema = z.strictObject({
  uuid: z.string(),
  memberUuid: z.string(),
  actor: z.string(),
  action: z.string(),
  details: z.string(),
  createdAt: z.string()
});

export const memberPortalSchema = z.strictObject({
  actorEmail: z.string(),
  role: z.enum(["student", "master", "club_admin", "super_admin", "unregistered"]),
  self: memberRecordSchema.nullable(),
  members: z.array(memberRecordSchema)
});

export function parseMemberPayload(input: unknown) {
  if (input && typeof input === "object") {
    const copy = { ...(input as Record<string, unknown>) };
    delete copy.uuid;
    delete copy.createdAt;
    delete copy.updatedAt;
    delete copy.id;
    return memberPayloadSchema.parse(copy);
  }
  return memberPayloadSchema.parse(input);
}
