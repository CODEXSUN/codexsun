import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { FrappeConnectionRepository, requestFrappe } from "../connection/index.js";
import type { FrappeDatabase } from "../connection/index.js";
import type { CallLogImportProgress } from "./call-log-sync.types.js";

type RemoteCall = {
  name: string;
  from?: string | null;
  to?: string | null;
  type?: string | null;
  status?: string | null;
  duration?: number | null;
  receiver?: string | null;
  caller?: string | null;
  creation?: string | null;
  start_time?: string | null;
};
const fields = [
  "name",
  "from",
  "to",
  "type",
  "status",
  "duration",
  "receiver",
  "caller",
  "creation",
  "start_time"
];

export async function previewFrappeCallLogs(
  database: Kysely<FrappeDatabase>,
  secret: string,
  page: number
) {
  const credentials = await new FrappeConnectionRepository(database).credentials(secret);
  if (!credentials?.row.enabled || credentials.row.verification_status !== "verified")
    throw AppError.conflict("Verify the Frappe connection before importing call logs.");
  const query = new URLSearchParams({
    fields: JSON.stringify(fields),
    order_by: "creation asc",
    limit_start: String((page - 1) * 50),
    limit_page_length: "51"
  });
  const response = await requestFrappe<{ data?: RemoteCall[] }>(
    `/api/resource/CRM%20Call%20Log?${query}`,
    "GET",
    credentials.settings
  );
  if (!Array.isArray(response.data))
    throw AppError.validation("Frappe returned an invalid call log page.");
  const shown = response.data.slice(0, 50);
  const names = shown.map((call) => call.name);
  const links = names.length
    ? await sql<{ remote_name: string; id: number }>`SELECT remote_name, id FROM crm_call_logs
    WHERE remote_name IN (${sql.join(names)})`.execute(database)
    : { rows: [] };
  const local = new Map(links.rows.map((row) => [row.remote_name, row.id]));
  return {
    page,
    pageSize: 50,
    hasMore: response.data.length > 50,
    items: shown.map((call) => ({
      name: call.name,
      from: call.from || null,
      to: call.to || null,
      direction: call.type || null,
      status: call.status || null,
      startedAt: call.start_time || call.creation || null,
      localCallLogId: local.get(call.name) ?? null
    }))
  };
}

export async function pullFrappeCallLog(
  database: Kysely<FrappeDatabase>,
  secret: string,
  remoteName: string
) {
  const existing = await sql<{
    id: number;
  }>`SELECT id FROM crm_call_logs WHERE remote_name=${remoteName} LIMIT 1`.execute(database);
  if (existing.rows[0])
    return { remoteName, localId: existing.rows[0].id, status: "linked" as const };
  const credentials = await new FrappeConnectionRepository(database).credentials(secret);
  if (!credentials?.row.enabled || credentials.row.verification_status !== "verified")
    throw AppError.conflict("Verify the Frappe connection before importing call logs.");
  const response = await requestFrappe<{ data?: RemoteCall }>(
    `/api/resource/CRM%20Call%20Log/${encodeURIComponent(remoteName)}`,
    "GET",
    credentials.settings
  );
  const call = response.data;
  if (!call || call.name !== remoteName) throw AppError.notFound("Frappe call log was not found.");
  if (!call.from || !call.to || !["Incoming", "Outgoing"].includes(call.type ?? ""))
    throw AppError.validation("Frappe call log has missing required fields.");
  const started = call.start_time || call.creation;
  if (started && Number.isNaN(Date.parse(started)))
    throw AppError.validation("Frappe call log has an invalid date.");
  await sql`INSERT INTO crm_call_logs
    (remote_name, direction, from_number, to_number, call_status, duration_seconds, user_email,
     started_at, created_by, created_at)
    VALUES (${call.name}, ${call.type}, ${call.from}, ${call.to}, ${call.status || "Initiated"},
      ${Math.max(0, Number(call.duration) || 0)}, ${call.type === "Incoming" ? call.receiver || null : call.caller || null},
      ${started || sql`UTC_TIMESTAMP()`}, 'system:frappe-import', ${call.creation || sql`UTC_TIMESTAMP()`})
    ON DUPLICATE KEY UPDATE id=id`.execute(database);
  const found = await sql<{
    id: number;
  }>`SELECT id FROM crm_call_logs WHERE remote_name=${remoteName} LIMIT 1`.execute(database);
  return { remoteName, localId: found.rows[0]!.id, status: "created" as const };
}

export async function importFrappeCallLogs(
  database: Kysely<FrappeDatabase>,
  secret: string,
  expectedBaseUrl: string,
  report: (progress: CallLogImportProgress) => Promise<void>
) {
  const progress: CallLogImportProgress = {
    scanned: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    failures: []
  };
  for (let offset = 0; ; offset += 100) {
    const credentials = await new FrappeConnectionRepository(database).credentials(secret);
    if (
      !credentials?.row.enabled ||
      credentials.row.verification_status !== "verified" ||
      credentials.settings.baseUrl !== expectedBaseUrl
    )
      throw AppError.conflict("The verified Frappe connection changed during call log import.");
    const query = new URLSearchParams({
      fields: JSON.stringify(fields),
      order_by: "creation asc",
      limit_start: String(offset),
      limit_page_length: "100"
    });
    const response = await requestFrappe<{ data?: RemoteCall[] }>(
      `/api/resource/CRM%20Call%20Log?${query}`,
      "GET",
      credentials.settings
    );
    if (!Array.isArray(response.data))
      throw AppError.validation("Frappe returned an invalid call log page.");
    for (const call of response.data) {
      progress.scanned += 1;
      try {
        if (
          !call.name ||
          !call.from ||
          !call.to ||
          !["Incoming", "Outgoing"].includes(call.type ?? "")
        )
          throw AppError.validation("The Frappe call log has missing required fields.");
        const existing = await sql<{
          id: number;
        }>`SELECT id FROM crm_call_logs WHERE remote_name=${call.name} LIMIT 1`.execute(database);
        if (existing.rows.length) {
          progress.skipped += 1;
          continue;
        }
        const user = call.type === "Incoming" ? call.receiver : call.caller;
        const started = call.start_time || call.creation;
        const result = await sql`INSERT INTO crm_call_logs
          (remote_name, direction, from_number, to_number, call_status, duration_seconds, user_email,
           started_at, created_by, created_at)
          VALUES (${call.name}, ${call.type}, ${call.from}, ${call.to}, ${call.status || "Initiated"},
            ${Math.max(0, Number(call.duration) || 0)}, ${user || null},
            ${started || sql`UTC_TIMESTAMP()`}, 'system:frappe-import', ${call.creation || sql`UTC_TIMESTAMP()`})
          ON DUPLICATE KEY UPDATE id=id`.execute(database);
        if (Number(result.numAffectedRows) === 1) progress.created += 1;
        else progress.skipped += 1;
      } catch (error) {
        progress.failed += 1;
        if (progress.failures.length < 100)
          progress.failures.push({
            name: call.name || "unknown",
            message: error instanceof Error ? error.message : "Import failed."
          });
      }
    }
    await report(progress);
    if (response.data.length < 100) break;
  }
  return progress;
}
