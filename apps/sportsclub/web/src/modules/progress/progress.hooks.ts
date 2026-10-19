import { useQuery } from "@tanstack/react-query";
import { getProgress, listProgressPage } from "./progress.services";
import type { ProgressColumnFilters } from "./progress.types";

export const progressQueryKeys = {
  all: ["sportsclub", "progress"] as const,
  list: (options: {
    page: number;
    pageSize: number;
    search: string;
    status?: string;
    columnFilters?: ProgressColumnFilters;
  }) => ["sportsclub", "progress", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "progress", "detail", uuid] as const
};

export function useProgressPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: ProgressColumnFilters;
}) {
  return useQuery({
    queryKey: progressQueryKeys.list(options),
    queryFn: () => listProgressPage(options)
  });
}

export function useProgressDetails(uuid: string | null | undefined) {
  return useQuery({
    queryKey: progressQueryKeys.details(uuid ?? ""),
    queryFn: () => getProgress(uuid!),
    enabled: Boolean(uuid)
  });
}
