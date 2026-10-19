import { useQuery } from "@tanstack/react-query";
import { getEvent, listEventsPage } from "./event.services";
import type { EventColumnFilters } from "./event.types";

export const eventQueryKeys = {
  all: ["sportsclub", "events"] as const,
  list: (options: {
    page: number;
    pageSize: number;
    search: string;
    status?: string;
    columnFilters?: EventColumnFilters;
  }) => ["sportsclub", "events", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "events", "detail", uuid] as const
};

export function useEventsPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: EventColumnFilters;
}) {
  return useQuery({
    queryKey: eventQueryKeys.list(options),
    queryFn: () => listEventsPage(options)
  });
}

export function useEventDetails(uuid: string | null | undefined) {
  return useQuery({
    queryKey: eventQueryKeys.details(uuid ?? ""),
    queryFn: () => getEvent(uuid!),
    enabled: Boolean(uuid)
  });
}
