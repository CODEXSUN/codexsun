import type { z } from "zod";
import type {
  enquirySchema,
  enquiryRecordSchema,
  enquiryQuerySchema,
  enquiryStatusSchema
} from "./enquiry.schema.js";
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type EnquiryRecord = z.infer<typeof enquiryRecordSchema>;
export type EnquiryQuery = z.infer<typeof enquiryQuerySchema>;
export type EnquiryStatus = z.infer<typeof enquiryStatusSchema>;
