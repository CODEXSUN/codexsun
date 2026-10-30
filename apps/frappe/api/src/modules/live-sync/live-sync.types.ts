import type { ExportKind, ExportProgress } from "../export/index.js";
export type LiveSyncSettings = {
  enabled: boolean;
  paused: boolean;
  direction: "inbound" | "bidirectional";
  inboundBaseUrl: string | null;
  inboundCheckpointAt: string | null;
  scheduleMinutes: 1 | 5 | 15 | 30 | 60;
  modules: Record<ExportKind, boolean>;
  lastScheduledAt: string | null;
  updatedAt: string;
  updatedBy: string;
  backgroundWorkerEnabled: boolean;
};
export type LiveSyncJob = {
  id: number;
  kind: ExportKind;
  status: string;
  createdAt: string;
  errorMessage: string | null;
  progress: ExportProgress | null;
};
