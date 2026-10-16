import { FrappeEnquirySyncService } from "./enquiry-sync.service.js";
import type { FrappeSettings } from "../connection/index.js";
import type { EnquirySyncContext, ImportProgress } from "./enquiry-sync.types.js";

export const frappeEnquiryImportJobName = "frappe.enquiries.import";

export async function processFrappeEnquiryImportJob(
  context: EnquirySyncContext,
  defaults: FrappeSettings,
  encryptionSecret: string,
  expectedBaseUrl: string,
  report: (progress: ImportProgress) => Promise<void>
) {
  return new FrappeEnquirySyncService(context, defaults, encryptionSecret).importUnlinked(
    report,
    expectedBaseUrl
  );
}
