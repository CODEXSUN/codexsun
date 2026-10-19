import type { z } from "zod";
import type {
  enquiryPayloadSchema,
  enquiryRecordSchema,
  publicEnquirySubmissionSchema
} from "./enquiry.schema.js";

export type PublicEnquirySubmission = z.infer<typeof publicEnquirySubmissionSchema>;
export type EnquiryPayload = z.infer<typeof enquiryPayloadSchema>;
export type EnquiryRecord = z.infer<typeof enquiryRecordSchema>;
