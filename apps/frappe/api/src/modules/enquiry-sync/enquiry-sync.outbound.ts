import type { Kysely } from "kysely";
import { EnquirySyncRepository, type EnquiryDatabase } from "@codexsun/crm-api/enquiry-sync";
import { FrappeConnectionAccess, type FrappeDatabase } from "../connection/index.js";
import type { FrappeSettings } from "../connection/index.js";
import { FrappeExportService } from "../export/index.js";

export async function processLocalEnquirySync(
  database: Kysely<FrappeDatabase>,
  eventId: number,
  encryptionSecret: string,
  defaults: FrappeSettings
) {
  const sync = new EnquirySyncRepository(database as unknown as Kysely<EnquiryDatabase>);
  const event = await sync.getEvent(eventId);
  if (!event) throw new Error("CRM enquiry sync event was not found.");
  if (event.event_type !== "enquiry-upsert") {
    await sync.markFailed(eventId, event.attempts, "This Frappe sync action is not supported.");
    return { eventId, status: "failed" as const, remoteName: event.remote_name };
  }
  if (!(await sync.markProcessing(eventId)))
    return { eventId, status: event.status, remoteName: event.remote_name };

  try {
    const connection = await new FrappeConnectionAccess(
      database,
      encryptionSecret,
      defaults
    ).exportCredentials();
    if (!connection) throw new Error("Enable and verify the Frappe connection before exporting.");
    const progress = await new FrappeExportService(
      database,
      encryptionSecret,
      defaults
    ).exportSelection(
      "enquiries",
      [event.enquiry_id],
      "export",
      connection.baseUrl,
      async () => {}
    );
    const result = progress.results[0];
    if (progress.failed || !result?.remoteName) {
      const message = result?.message || progress.failures[0]?.message || "Frappe export failed.";
      await sync.markFailed(eventId, event.attempts, message);
      return { eventId, status: "retry" as const, remoteName: event.remote_name, error: message };
    }
    await sync.markSynced(eventId, result.remoteName);
    return { eventId, status: "synced" as const, remoteName: result.remoteName };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Frappe export failed.";
    await sync.markFailed(eventId, event.attempts, message);
    return { eventId, status: "retry" as const, remoteName: event.remote_name, error: message };
  }
}
