/**
 * @file Public & Authenticated API Contracts for Sportsclub
 *
 * Exported for consumption by:
 * - Sites Public Client & Cloudflare Worker (AGR-3 / AGR-4)
 * - Sportsclub Web Desk (Private List & Upsert Forms)
 * - Platform Composition & Tenant Routing
 */

export * from "./sportsclub.pagination.js";

export {
  publicProgramSchema,
  programPayloadSchema,
  programRecordSchema,
  programSelectableColumns,
  programListQuerySchema,
  programListResponseSchema
} from "./modules/program/program.schema.js";

export {
  publicMasterSchema,
  masterPayloadSchema,
  masterRecordSchema,
  masterSelectableColumns,
  masterListQuerySchema,
  masterListResponseSchema
} from "./modules/master/master.schema.js";

export {
  studentEnrollmentSchema,
  memberPayloadSchema,
  memberRecordSchema,
  memberPortalSchema,
  memberActivitySchema,
  parseMemberPayload,
  memberSelectableColumns,
  memberListQuerySchema,
  memberListResponseSchema
} from "./modules/member/member.schema.js";

export {
  publicSessionSchema,
  sessionPayloadSchema,
  sessionRecordSchema,
  sessionSelectableColumns,
  sessionListQuerySchema,
  sessionListResponseSchema
} from "./modules/session/session.schema.js";

export {
  attendancePayloadSchema,
  attendanceRecordSchema,
  attendanceSelectableColumns,
  attendanceListQuerySchema,
  attendanceListResponseSchema
} from "./modules/attendance/attendance.schema.js";

export {
  progressEvaluationInputSchema,
  progressPayloadSchema,
  progressRecordSchema,
  studentProgressViewSchema,
  progressSelectableColumns,
  progressListQuerySchema,
  progressListResponseSchema
} from "./modules/progress/progress.schema.js";

export {
  publicEventSchema,
  eventPayloadSchema,
  eventRecordSchema,
  eventSelectableColumns,
  eventListQuerySchema,
  eventListResponseSchema
} from "./modules/event/event.schema.js";

export {
  publicEnquirySubmissionSchema,
  enquiryPayloadSchema,
  enquiryRecordSchema,
  enquirySelectableColumns,
  enquiryListQuerySchema,
  enquiryListResponseSchema
} from "./modules/enquiry/enquiry.schema.js";

export const SPORTSCLUB_PUBLIC_ENROLL_PATH = "/sportsclub/public/enroll" as const;
export const SPORTSCLUB_PUBLIC_REGISTRATION_PATH = "/sportsclub/public/registration" as const;
export const SPORTSCLUB_PUBLIC_ENQUIRY_PATH = "/sportsclub/public/enquiry" as const;
export const SPORTSCLUB_PUBLIC_HEALTH_PATH = "/sportsclub/public/health" as const;
export const SPORTSCLUB_ACCESS_PATH = "/sportsclub/access" as const;

export * from "./sportsclub.billing-contract.js";
