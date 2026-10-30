import { useQuery } from "@tanstack/react-query";
import { getProgram, getProgramLookup, listProgramsPage } from "./program.services";
import type { ProgramColumnFilters } from "./program.types";

export const programQueryKeys = {
  all: ["sportsclub", "programs"] as const,
  list: (options: {
    page: number;
    pageSize?: number | undefined;
    search: string;
    status?: string | undefined;
    columns?: string | undefined;
    columnFilters?: ProgramColumnFilters | undefined;
  }) => ["sportsclub", "programs", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "programs", "detail", uuid] as const,
  lookups: (search: string) => ["sportsclub", "programs", "lookups", search] as const
};

export function useProgramsPage(options: {
  page: number;
  pageSize?: number | undefined;
  search: string;
  status?: string | undefined;
  columns?: string | undefined;
  columnFilters?: ProgramColumnFilters | undefined;
}) {
  return useQuery({
    queryKey: programQueryKeys.list(options),
    queryFn: () => listProgramsPage(options)
  });
}

export function useProgramDetails(uuid: string | null | undefined) {
  return useQuery({
    queryKey: programQueryKeys.details(uuid ?? ""),
    queryFn: () => getProgram(uuid!),
    enabled: Boolean(uuid)
  });
}

export function useProgramLookups(search = "") {
  return useQuery({
    queryKey: programQueryKeys.lookups(search),
    queryFn: () => getProgramLookup(search)
  });
}
