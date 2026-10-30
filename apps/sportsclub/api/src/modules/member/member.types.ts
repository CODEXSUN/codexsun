import type { z } from "zod";
import type {
  memberActivitySchema,
  memberListQuerySchema,
  memberListResponseSchema,
  memberPayloadSchema,
  memberPortalSchema,
  memberRecordSchema,
  memberPhotoSchema,
  memberPhotoUploadSchema,
  memberSelectableColumns,
  studentEnrollmentSchema
} from "./member.schema.js";

export type StudentEnrollment = z.infer<typeof studentEnrollmentSchema>;
export type MemberPayload = z.infer<typeof memberPayloadSchema>;
export type MemberRecord = z.infer<typeof memberRecordSchema>;
export type MemberPhoto = z.infer<typeof memberPhotoSchema>;
export type MemberPhotoUpload = z.infer<typeof memberPhotoUploadSchema>;
export type MemberActivity = z.infer<typeof memberActivitySchema>;
export type MemberPortal = z.infer<typeof memberPortalSchema>;
export type MemberSelectableColumn = (typeof memberSelectableColumns)[number];
export type MemberListQuery = z.input<typeof memberListQuerySchema>;
export type MemberListResponse = z.infer<typeof memberListResponseSchema>;
