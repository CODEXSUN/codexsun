import { useQuery } from "@tanstack/react-query";
import { listActivities, listActivityStatuses } from "./activities.services";
import type { ActivityFilters } from "./activities.types";

export function useActivities(filters: ActivityFilters) {
  return useQuery({
    queryKey: ["crm", "activities", filters],
    queryFn: () => listActivities(filters)
  });
}

export function useActivityStatuses() {
  return useQuery({
    queryKey: ["crm", "activities", "statuses"],
    queryFn: listActivityStatuses
  });
}
