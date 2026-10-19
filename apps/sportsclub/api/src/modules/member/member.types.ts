import type { z } from "zod";
import type {
  memberActivitySchema,
  memberPayloadSchema,
  memberPortalSchema,
  memberRecordSchema,
  studentEnrollmentSchema
} from "./member.schema.js";

export type StudentEnrollment = z.infer<typeof studentEnrollmentSchema>;
export type MemberPayload = z.infer<typeof memberPayloadSchema>;
export type MemberRecord = z.infer<typeof memberRecordSchema>;
export type MemberActivity = z.infer<typeof memberActivitySchema>;
export type MemberPortal = z.infer<typeof memberPortalSchema>;
