import { useQuery } from "@tanstack/react-query";
import { getSession, listSessionLookups, listSessionsPage } from "./session.services";
import type { SessionColumnFilters } from "./session.types";

export const sessionQueryKeys = {
  all: ["sportsclub", "sessions"] as const,
  list: (options: {
    page: number;
    pageSize: number;
    search: string;
    status?: string;
    columnFilters?: SessionColumnFilters;
  }) => ["sportsclub", "sessions", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "sessions", "detail", uuid] as const,
  lookups: (search: string) => ["sportsclub", "sessions", "lookups", search] as const
};

export function useSessionsPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: SessionColumnFilters;
}) {
  return useQuery({
    queryKey: sessionQueryKeys.list(options),
    queryFn: () => listSessionsPage(options)
  });
}

export function useSessionDetails(uuid: string | null | undefined) {
  return useQuery({
    queryKey: sessionQueryKeys.details(uuid ?? ""),
    queryFn: () => getSession(uuid!),
    enabled: Boolean(uuid)
  });
}

export function useSessionLookups(search = "") {
  return useQuery({
    queryKey: sessionQueryKeys.lookups(search),
    queryFn: () => listSessionLookups(search)
  });
}
