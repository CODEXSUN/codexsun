import { sql, type Kysely } from "kysely";
import {
  enqueueCrmFrappeSync,
  CrmFrappeSyncRepository,
  type CrmFrappeSyncDatabase
} from "@codexsun/crm-api";
import {
  FrappeConnectionAccess,
  type FrappeDatabase,
  type FrappeSettings
} from "../connection/index.js";
import { FrappeLiveSyncService } from "../live-sync/index.js";
import { FrappeExportService } from "./export.service.js";

export type ContactExportDatabase = FrappeDatabase & CrmFrappeSyncDatabase;

export async function requestContactExport(
  database: Kysely<ContactExportDatabase>,
  id: number,
  actor: string
) {
  const source = await sql<{
    updated_at: string | Date;
  }>`SELECT updated_at FROM core_contacts WHERE id=${id} AND deleted_at IS NULL`.execute(database);
  if (!source.rows[0]) throw new Error("Contact was not found for export.");
  const updatedAt = new Date(source.rows[0].updated_at)
    .toISOString()
    .slice(0, 23)
    .replace("T", " ");
  await enqueueCrmFrappeSync(database, "contact", id, actor, updatedAt);
  return new CrmFrappeSyncRepository(database).find("contact", id);
}

export async function recoverContactExports(database: Kysely<ContactExportDatabase>) {
  const candidates = await sql<{ id: number }>`SELECT c.id FROM core_contacts c
    CROSS JOIN frappe_live_sync_settings settings
    LEFT JOIN crm_frappe_sync_queue q ON q.entity_type='contact' AND q.local_record_id=c.id
    WHERE settings.id=1 AND settings.contact_export_started_at IS NOT NULL
      AND c.deleted_at IS NULL AND c.updated_at>=settings.contact_export_started_at
      AND (q.id IS NULL OR c.updated_at>q.source_updated_at)
    ORDER BY c.id LIMIT 50`.execute(database);
  for (const row of candidates.rows)
    await requestContactExport(database, row.id, "system:contact-export-recovery");
}

export async function processContactExport(
  database: Kysely<ContactExportDatabase>,
  queueId: number,
  secret: string,
  defaults: FrappeSettings
) {
  const live = await new FrappeLiveSyncService(database).settings();
  if (live.direction !== "bidirectional" || !live.enabled || live.paused || !live.modules.contacts)
    throw new Error("Automatic contact export is paused: Frappe → CRM only.");
  const event = await database
    .selectFrom("crm_frappe_sync_queue")
    .selectAll()
    .where("id", "=", queueId)
    .where("entity_type", "=", "contact")
    .executeTakeFirst();
  if (!event) throw new Error("Contact export event was not found.");
  if (event.status === "synced") return { status: "synced", remoteName: event.remote_name };
  const claim = await database
    .updateTable("crm_frappe_sync_queue")
    .set({ status: "processing", attempts: sql`attempts+1` })
    .where("id", "=", queueId)
    .where("status", "=", "pending")
    .where("dispatch_revision", "=", event.dispatch_revision)
    .where("attempts", "<", 5)
    .executeTakeFirst();
  if (!Number(claim.numUpdatedRows)) return { status: "deferred" };
  try {
    const settings = await new FrappeConnectionAccess(
      database,
      secret,
      defaults
    ).exportCredentials();
    if (!settings)
      throw new Error("Verify and enable the Frappe connection before exporting contacts.");
    const progress = await new FrappeExportService(database, secret, defaults).exportSelection(
      "contacts",
      [event.local_record_id],
      "export",
      settings.baseUrl,
      async () => {}
    );
    const result = progress.results[0];
    if (progress.failed || !result?.remoteName)
      throw new Error(result?.message || progress.failures[0]?.message || "Contact export failed.");
    await database
      .updateTable("crm_frappe_sync_queue")
      .set({
        status: sql`CASE WHEN dispatch_revision=${event.dispatch_revision} THEN 'synced' ELSE 'pending' END`,
        attempts: sql`CASE WHEN dispatch_revision<>${event.dispatch_revision} THEN 0 ELSE attempts END`,
        remote_name: result.remoteName,
        last_error: null,
        available_at: sql`UTC_TIMESTAMP()`,
        updated_at: sql`UTC_TIMESTAMP()`
      })
      .where("id", "=", queueId)
      .where("status", "=", "processing")
      .execute();
    return { status: "synced", remoteName: result.remoteName, ...progress };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contact export failed.";
    await database
      .updateTable("crm_frappe_sync_queue")
      .set({
        status: sql`CASE WHEN dispatch_revision<>${event.dispatch_revision} OR attempts<5 THEN 'pending' ELSE 'failed' END`,
        attempts: sql`CASE WHEN dispatch_revision<>${event.dispatch_revision} THEN 0 ELSE attempts END`,
        last_error: message.slice(0, 2000),
        available_at: sql`DATE_ADD(UTC_TIMESTAMP(), INTERVAL ${Math.min(300, 5 * 2 ** event.attempts)} SECOND)`,
        updated_at: sql`UTC_TIMESTAMP()`
      })
      .where("id", "=", queueId)
      .where("status", "=", "processing")
      .execute();
    throw error;
  }
}

export async function contactDeliveryStates(
  database: Kysely<ContactExportDatabase>,
  ids: number[]
) {
  if (!ids.length) return [];
  return database
    .selectFrom("crm_frappe_sync_queue")
    .select(["local_record_id as id", "status", "last_error as message"])
    .where("entity_type", "=", "contact")
    .where("local_record_id", "in", ids)
    .execute();
}
