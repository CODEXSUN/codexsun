import type { DutyReportDatabase, CrmFrappeSyncDatabase } from "@codexsun/crm-api";
import type { FrappeDatabase } from "../connection/index.js";
export type SyncDatabase = DutyReportDatabase & CrmFrappeSyncDatabase & FrappeDatabase;
export type SyncResult =
  | { eventId: number; status: "synced"; remoteName: string }
  | { eventId: number; status: "skipped" };
