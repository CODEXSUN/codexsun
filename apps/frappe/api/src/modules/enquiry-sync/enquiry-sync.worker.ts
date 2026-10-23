import { FrappeEnquirySyncService } from "./enquiry-sync.service.js";
import { FrappeConnectionAccess, type FrappeSettings } from "../connection/index.js";
import type { EnquirySyncContext, ImportProgress } from "./enquiry-sync.types.js";
import { FrappeLiveSyncService } from "../live-sync/index.js";
import { withEnquiryImportLock } from "./enquiry-sync.lock.js";

export const frappeEnquiryImportJobName = "frappe.enquiries.import";

export async function processFrappeEnquiryImportJob(
  context: EnquirySyncContext,
  defaults: FrappeSettings,
  encryptionSecret: string,
  expectedBaseUrl: string,
  modifiedAfter: string | undefined,
  report: (progress: ImportProgress) => Promise<void>,
  checkpointAt?: string
) {
  return withEnquiryImportLock(context.database, async () => {
    const liveSync = new FrappeLiveSyncService(context.database);
    if (checkpointAt) {
      const settings = await liveSync.settings();
      if (!settings.enabled || settings.paused || !settings.modules.enquiries)
        return { scanned: 0, created: 0, skipped: 0, failed: 0, failures: [] };
      if (settings.inboundBaseUrl && settings.inboundBaseUrl !== expectedBaseUrl) {
        const linked = await context.database
          .selectFrom("frappe_enquiry_sync")
          .select("enquiry_id")
          .limit(1)
          .executeTakeFirst();
        if (linked)
          throw new Error(
            "This CRM has enquiry links to another Frappe site. Reconcile source identities before switching sites."
          );
      }
      const connection = await new FrappeConnectionAccess(
        context.database,
        encryptionSecret,
        defaults
      ).credentials();
      if (!connection || connection.baseUrl !== expectedBaseUrl)
        throw new Error("Verify and enable the same Frappe connection before live import.");
    }
    const service = new FrappeEnquirySyncService(context, defaults, encryptionSecret);
    const progress = modifiedAfter
      ? await service.importModifiedSince(modifiedAfter, report, expectedBaseUrl)
      : await service.importUnlinked(report, expectedBaseUrl, !checkpointAt);
    await report(progress);
    if (checkpointAt) {
      if (progress.failed)
        throw new Error(
          `Frappe import has ${progress.failed} failed records. Checkpoint unchanged. ${progress.failures[0]?.message ?? ""}`
        );
      if ((await service.connectionOrigin()) !== expectedBaseUrl)
        throw new Error("Frappe connection changed. Checkpoint unchanged.");
      await liveSync.completeInbound(expectedBaseUrl, checkpointAt);
    }
    return progress;
  });
}
