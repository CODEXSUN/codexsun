import type { z } from "zod";

import type {
  enquiryDetailSchema,
  enquiryRecordSchema,
  enquiryListSchema,
  enquiryQuerySchema
} from "@codexsun/sites-api/enquiry-contract";

export type EnquiryRecord = z.infer<typeof enquiryRecordSchema>;

export type EnquiryDetail = z.infer<typeof enquiryDetailSchema>;

export type EnquiryQuery = z.infer<typeof enquiryQuerySchema>;

export type EnquiryGateway = {
  list(uuid: string, query: EnquiryQuery): Promise<z.infer<typeof enquiryListSchema>>;
  get(uuid: string, reference: string): Promise<EnquiryDetail>;
  status(
    uuid: string,
    record: EnquiryRecord,
    status: EnquiryRecord["status"]
  ): Promise<EnquiryDetail>;
  trash(uuid: string, record: EnquiryRecord, restore: boolean): Promise<EnquiryDetail>;
};

export const enquiryStatuses = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "spam", label: "Spam" }
];
