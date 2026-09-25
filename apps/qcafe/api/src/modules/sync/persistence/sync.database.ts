import type { Generated } from "kysely";
import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

export interface QcafeDeviceProfileRow {
  business_id: string;
  created_at: string;
  created_by: string;
  device_code: string;
  id: string;
  last_seen_at: string | null;
  location_id: string;
  name: string;
  platform: "web" | "desktop" | "mobile";
  status: "active" | "revoked";
  updated_at: string;
}

export interface QcafeChangeLogRow {
  actor_ref: string;
  business_id: string;
  change_kind: string;
  created_at: string;
  device_id: string | null;
  entity_id: string;
  entity_type: string;
  id: string;
  location_id: string;
  occurred_at: string;
  seq: Generated<number>;
}

export interface QcafeSyncCursorRow {
  device_id: string;
  last_seq: number;
  updated_at: string;
}

export interface QcafeSyncConflictRow {
  business_id: string;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  entity_id: string;
  entity_type: string;
  id: string;
  local_change_id: string | null;
  location_id: string;
  reason: string;
  remote_change_id: string | null;
  resolution: string | null;
  status: "pending" | "resolved" | "escalated";
}

export interface QcafeSyncTables {
  qcafe_change_log: QcafeChangeLogRow;
  qcafe_device_profiles: QcafeDeviceProfileRow;
  qcafe_sync_conflicts: QcafeSyncConflictRow;
  qcafe_sync_cursors: QcafeSyncCursorRow;
}

export type QcafeSyncDatabase = QcafeFoundationDatabase & QcafeSyncTables;
