import { useQuery } from "@tanstack/react-query";
import { getMaster, listMasterLookups, listMastersPage } from "./master.services";
import type { MasterColumnFilters } from "./master.types";

export const masterQueryKeys = {
  all: ["sportsclub", "masters"] as const,
  list: (options: {
    page: number;
    pageSize: number;
    search: string;
    status?: string;
    columnFilters?: MasterColumnFilters;
  }) => ["sportsclub", "masters", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "masters", "detail", uuid] as const,
  lookups: () => ["sportsclub", "masters", "lookups"] as const
};

export function useMastersPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: MasterColumnFilters;
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

export function useMasterLookups() {
  return useQuery({
    queryKey: masterQueryKeys.lookups(),
    queryFn: listMasterLookups
  });
}
