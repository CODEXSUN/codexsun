import type { QcafeFoundationDatabase } from "../../foundation/persistence/qcafe-foundation.database.js";

export interface QcafeDataFolderRow {
  folder_path: string;
  location_id: string;
  selected_at: string;
  selected_by: string;
  updated_at: string;
}

export interface QcafeBackupScheduleRow {
  active: number;
  business_id: string;
  created_at: string;
  created_by: string;
  frequency: "daily" | "weekly" | "manual";
  id: string;
  location_id: string;
  name: string;
  retain_count: number;
  updated_at: string;
}

export interface QcafeBackupRow {
  business_id: string;
  checksum: string;
  created_at: string;
  created_by: string;
  file_ref: string;
  id: string;
  location_id: string;
  schedule_id: string | null;
  size_bytes: number;
  status: "completed" | "failed" | "verified";
}

export interface QcafeRestoreCheckRow {
  backup_id: string;
  checked_at: string;
  checked_by: string;
  detail: string | null;
  id: string;
  status: "passed" | "failed";
}

export interface QcafeBackupTables {
  qcafe_backup_schedules: QcafeBackupScheduleRow;
  qcafe_backups: QcafeBackupRow;
  qcafe_data_folders: QcafeDataFolderRow;
  qcafe_restore_checks: QcafeRestoreCheckRow;
}

export type QcafeBackupDatabase = QcafeFoundationDatabase & QcafeBackupTables;
