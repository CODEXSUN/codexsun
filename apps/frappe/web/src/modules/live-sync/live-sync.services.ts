import { frappeRequest } from "../../frappe-request";
import type { LiveSyncJob, LiveSyncKind, LiveSyncSettings } from "./live-sync.types";
export const getLiveSyncSettings = () =>
  frappeRequest<LiveSyncSettings>("GET", "/frappe/live-sync");
export const saveLiveSyncSettings = (
  input: Pick<LiveSyncSettings, "enabled" | "paused" | "scheduleMinutes" | "modules">
) => frappeRequest<LiveSyncSettings>("PUT", "/frappe/live-sync", input);
export const resyncLiveKind = (kind: LiveSyncKind) =>
  frappeRequest<{ id: number }>("POST", `/frappe/live-sync/${kind}/resync`, {});
export const getLiveSyncJobs = () => frappeRequest<LiveSyncJob[]>("GET", "/frappe/live-sync/jobs");
