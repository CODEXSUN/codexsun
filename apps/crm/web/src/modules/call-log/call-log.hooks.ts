import { useQuery } from "@tanstack/react-query";
import { listCallLogs, listCallLogOptions, listCallLogUsers } from "./call-log.services";
import type { CallLogFilters } from "./call-log.types";

export function useCallLogs(filters: CallLogFilters) {
  return useQuery({
    queryKey: ["crm", "call-logs", filters],
    queryFn: () => listCallLogs(filters)
  });
}

export function useCallLogOptions() {
  return useQuery({ queryKey: ["crm", "call-logs", "options"], queryFn: listCallLogOptions });
}

export function useCallLogUsers(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ["crm", "call-logs", "users", search],
    queryFn: () => listCallLogUsers(search),
    enabled
  });
}
