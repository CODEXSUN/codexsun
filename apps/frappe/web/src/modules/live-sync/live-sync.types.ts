export type LiveSyncKind = "contacts" | "enquiries" | "activities" | "call-logs";
export type LiveSyncSettings = {
  enabled: boolean;
  paused: boolean;
  scheduleMinutes: 5 | 15 | 30 | 60;
  modules: Record<LiveSyncKind, boolean>;
  lastScheduledAt: string | null;
  updatedAt: string;
  updatedBy: string;
  backgroundWorkerEnabled: boolean;
};
export type LiveSyncJob = {
  id: number;
  kind: LiveSyncKind;
  direction: "inbound" | "outbound";
  status: string;
  createdAt: string;
  errorMessage: string | null;
  progress: {
    scanned: number;
    exported?: number;
    created?: number;
    skipped?: number;
    failed: number;
  } | null;
};
