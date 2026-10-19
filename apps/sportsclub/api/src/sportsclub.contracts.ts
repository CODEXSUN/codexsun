/**
 * @file Public & Authenticated API Contracts for Sportsclub
 *
 * Exported for consumption by:
 * - Sites Public Client & Cloudflare Worker (AGR-3 / AGR-4)
 * - Sportsclub Web Desk (Private List & Upsert Forms)
 * - Platform Composition & Tenant Routing
 */

export {
  publicProgramSchema,
  programPayloadSchema,
  programRecordSchema
} from "./modules/program/program.schema.js";

export {
  publicMasterSchema,
  masterPayloadSchema,
  masterRecordSchema
} from "./modules/master/master.schema.js";

export {
  studentEnrollmentSchema,
  memberPayloadSchema,
  memberRecordSchema,
  memberPortalSchema,
  memberActivitySchema,
  parseMemberPayload
} from "./modules/member/member.schema.js";

export {
  publicSessionSchema,
  sessionPayloadSchema,
  sessionRecordSchema
} from "./modules/session/session.schema.js";

export {
  attendancePayloadSchema,
  attendanceRecordSchema
} from "./modules/attendance/attendance.schema.js";

export {
  progressEvaluationInputSchema,
  progressPayloadSchema,
  progressRecordSchema,
  studentProgressViewSchema
} from "./modules/progress/progress.schema.js";

export {
  publicEventSchema,
  eventPayloadSchema,
  eventRecordSchema
} from "./modules/event/event.schema.js";

export {
  publicEnquirySubmissionSchema,
  enquiryPayloadSchema,
  enquiryRecordSchema
} from "./modules/enquiry/enquiry.schema.js";

export const SPORTSCLUB_PUBLIC_ENROLL_PATH = "/sportsclub/public/enroll" as const;
export const SPORTSCLUB_PUBLIC_REGISTRATION_PATH = "/sportsclub/public/registration" as const;
export const SPORTSCLUB_PUBLIC_ENQUIRY_PATH = "/sportsclub/public/enquiry" as const;
