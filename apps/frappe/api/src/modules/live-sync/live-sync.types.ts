import type { ExportKind, ExportProgress } from "../export/index.js";
export type LiveSyncSettings = {
  enabled: boolean;
  paused: boolean;
  scheduleMinutes: 5 | 15 | 30 | 60;
  modules: Record<ExportKind, boolean>;
  lastScheduledAt: string | null;
  updatedAt: string;
  updatedBy: string;
};
export type LiveSyncJob = {
  id: number;
  kind: ExportKind;
  status: string;
  createdAt: string;
  errorMessage: string | null;
  progress: ExportProgress | null;
};
