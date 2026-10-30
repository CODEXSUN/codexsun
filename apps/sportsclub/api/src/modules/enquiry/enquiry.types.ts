import type { z } from "zod";
import type {
  enquiryListQuerySchema,
  enquiryListResponseSchema,
  enquiryPayloadSchema,
  enquiryRecordSchema,
  enquirySelectableColumns,
  publicEnquirySubmissionSchema
} from "./enquiry.schema.js";

export type PublicEnquirySubmission = z.infer<typeof publicEnquirySubmissionSchema>;
export type EnquiryPayload = z.infer<typeof enquiryPayloadSchema>;
export type EnquiryRecord = z.infer<typeof enquiryRecordSchema>;
export type EnquirySelectableColumn = (typeof enquirySelectableColumns)[number];
export type EnquiryListQuery = z.input<typeof enquiryListQuerySchema>;
export type EnquiryListResponse = z.infer<typeof enquiryListResponseSchema>;
