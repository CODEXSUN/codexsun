import { crmRequest } from "../../crm-request";
import type { ActivityFilters, ActivityPage } from "./activities.types";

export function listActivities(filters: ActivityFilters) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "") query.set(key, String(value));
  }
  return crmRequest<ActivityPage>(`/crm/activities?${query}`);
}

export async function listActivityStatuses() {
  const options = await crmRequest<{
    statuses: Array<{ name: string; code: string }>;
  }>("/crm/activities/options");
  return options.statuses;
}
