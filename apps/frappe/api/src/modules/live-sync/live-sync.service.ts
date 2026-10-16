import { sql, type Kysely } from "kysely";
import type { FrappeDatabase } from "../connection/index.js";
import type { ExportKind } from "../export/index.js";
import type { LiveSyncSettings } from "./live-sync.types.js";
const kinds: ExportKind[] = ["contacts", "enquiries", "activities", "call-logs"];
export class FrappeLiveSyncService {
  constructor(private readonly database: Kysely<FrappeDatabase>) {}
  async settings(): Promise<LiveSyncSettings> {
    const row = await this.database
      .selectFrom("frappe_live_sync_settings")
      .selectAll()
      .where("id", "=", 1)
      .executeTakeFirstOrThrow();
    const scheduleMinutes = (
      [5, 15, 30, 60].includes(row.schedule_minutes) ? row.schedule_minutes : 15
    ) as LiveSyncSettings["scheduleMinutes"];
    return {
      enabled: Boolean(row.enabled),
      paused: Boolean(row.paused),
      scheduleMinutes,
      modules: {
        contacts: Boolean(row.contacts_enabled),
        enquiries: Boolean(row.enquiries_enabled),
        activities: Boolean(row.activities_enabled),
        "call-logs": Boolean(row.call_logs_enabled)
      },
      lastScheduledAt: row.last_scheduled_at ? new Date(row.last_scheduled_at).toISOString() : null,
      updatedAt: new Date(row.updated_at).toISOString(),
      updatedBy: row.updated_by
    };
  }
  async save(
    input: Pick<LiveSyncSettings, "enabled" | "paused" | "scheduleMinutes" | "modules">,
    actorEmail: string
  ) {
    await this.database
      .updateTable("frappe_live_sync_settings")
      .set({
        enabled: input.enabled,
        paused: input.paused,
        schedule_minutes: input.scheduleMinutes,
        contacts_enabled: input.modules.contacts,
        enquiries_enabled: input.modules.enquiries,
        activities_enabled: input.modules.activities,
        call_logs_enabled: input.modules["call-logs"],
        updated_by: actorEmail,
        updated_at: new Date()
      })
      .where("id", "=", 1)
      .execute();
    return this.settings();
  }
  async dueKinds(now = new Date()) {
    const settings = await this.settings();
    if (!settings.enabled || settings.paused) return [];
    const dueAt = settings.lastScheduledAt
      ? new Date(settings.lastScheduledAt).getTime() + settings.scheduleMinutes * 60_000
      : 0;
    if (dueAt > now.getTime()) return [];
    await sql`UPDATE frappe_live_sync_settings SET last_scheduled_at=${now}, updated_at=UTC_TIMESTAMP() WHERE id=1`.execute(
      this.database
    );
    return kinds.filter((kind) => settings.modules[kind]);
  }
}
