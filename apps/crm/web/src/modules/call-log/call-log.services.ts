import { crmRequest } from "../../crm-request";
import type { CallLogFilters, CallLogInput, CallLogPage } from "./call-log.types";

export function listCallLogs(filters: CallLogFilters) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "") query.set(key, String(value));
  }
  return crmRequest<CallLogPage>(`/crm/call-logs?${query}`);
}

export function listCallLogOptions() {
  return crmRequest<{ types: string[]; statuses: string[] }>("/crm/call-logs/options");
}

export function listCallLogUsers(search: string) {
  return crmRequest<Array<{ value: string; label: string }>>(
    `/crm/call-logs/users?${new URLSearchParams({ search })}`
  );
}

export function createCallLog(input: CallLogInput) {
  return crmRequest<{ name: string }>("/crm/call-logs", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
