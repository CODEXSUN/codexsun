import { useQuery } from "@tanstack/react-query";
import { getProgram, listProgramLookups, listProgramsPage } from "./program.services";
import type { ProgramColumnFilters } from "./program.types";

export const programQueryKeys = {
  all: ["sportsclub", "programs"] as const,
  list: (options: {
    page: number;
    pageSize: number;
    search: string;
    status?: string;
    columnFilters?: ProgramColumnFilters;
  }) => ["sportsclub", "programs", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "programs", "detail", uuid] as const,
  lookups: () => ["sportsclub", "programs", "lookups"] as const
};

export function useProgramsPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: ProgramColumnFilters;
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

export function useProgramLookups() {
  return useQuery({
    queryKey: programQueryKeys.lookups(),
    queryFn: listProgramLookups
  });
}
