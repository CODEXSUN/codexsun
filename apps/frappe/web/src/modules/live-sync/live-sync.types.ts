export type LiveSyncKind = "contacts" | "enquiries" | "activities" | "call-logs";
export type LiveSyncSettings = {
  enabled: boolean;
  paused: boolean;
  scheduleMinutes: 5 | 15 | 30 | 60;
  modules: Record<LiveSyncKind, boolean>;
  lastScheduledAt: string | null;
  updatedAt: string;
  updatedBy: string;
};
export type LiveSyncJob = {
  id: number;
  kind: LiveSyncKind;
  status: string;
  createdAt: string;
  errorMessage: string | null;
  progress: { scanned: number; exported: number; failed: number } | null;
};
