import { FrappeEnquirySyncService } from "./enquiry-sync.service.js";
import type { FrappeSettings } from "../connection/index.js";
import type { EnquirySyncContext, ImportProgress } from "./enquiry-sync.types.js";

export const frappeEnquiryImportJobName = "frappe.enquiries.import";

export async function processFrappeEnquiryImportJob(
  context: EnquirySyncContext,
  defaults: FrappeSettings,
  encryptionSecret: string,
  expectedBaseUrl: string,
  modifiedAfter: string | undefined,
  report: (progress: ImportProgress) => Promise<void>
) {
  const service = new FrappeEnquirySyncService(context, defaults, encryptionSecret);
  return modifiedAfter
    ? service.importModifiedSince(modifiedAfter, report, expectedBaseUrl)
    : service.importUnlinked(report, expectedBaseUrl);
}
