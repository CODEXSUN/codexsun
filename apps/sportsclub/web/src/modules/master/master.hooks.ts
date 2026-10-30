import { useQuery } from "@tanstack/react-query";
import { getMaster, getMasterLookup, listMastersPage } from "./master.services";
import type { MasterColumnFilters } from "./master.types";

export const masterQueryKeys = {
  all: ["sportsclub", "masters"] as const,
  list: (options: {
    page: number;
    pageSize?: number | undefined;
    search: string;
    status?: string | undefined;
    columns?: string | undefined;
    columnFilters?: MasterColumnFilters | undefined;
  }) => ["sportsclub", "masters", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "masters", "detail", uuid] as const,
  lookups: (search: string) => ["sportsclub", "masters", "lookups", search] as const
};

export function useMastersPage(options: {
  page: number;
  pageSize?: number | undefined;
  search: string;
  status?: string | undefined;
  columns?: string | undefined;
  columnFilters?: MasterColumnFilters | undefined;
}) {
  return useQuery({
    queryKey: masterQueryKeys.list(options),
    queryFn: () => listMastersPage(options)
  });
}

export function useMasterDetails(uuid: string | null | undefined) {
  return useQuery({
    queryKey: masterQueryKeys.details(uuid ?? ""),
    queryFn: () => getMaster(uuid!),
    enabled: Boolean(uuid)
  });
}

export function useMasterLookups(search = "") {
  return useQuery({
    queryKey: masterQueryKeys.lookups(search),
    queryFn: () => getMasterLookup(search)
  });
}
