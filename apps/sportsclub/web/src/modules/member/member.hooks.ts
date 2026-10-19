import { useQuery } from "@tanstack/react-query";
import { getMember, listMemberLookups, listMembersPage } from "./member.services";
import type { MemberColumnFilters } from "./member.types";

export const memberQueryKeys = {
  all: ["sportsclub", "members"] as const,
  list: (options: {
    page: number;
    pageSize: number;
    search: string;
    status?: string;
    columnFilters?: MemberColumnFilters;
  }) => ["sportsclub", "members", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "members", "detail", uuid] as const,
  lookups: () => ["sportsclub", "members", "lookups"] as const
};

export function useMembersPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: MemberColumnFilters;
}) {
  return useQuery({
    queryKey: memberQueryKeys.list(options),
    queryFn: () => listMembersPage(options)
  });
}

export function useMemberDetails(uuid: string | null | undefined) {
  return useQuery({
    queryKey: memberQueryKeys.details(uuid ?? ""),
    queryFn: () => getMember(uuid!),
    enabled: Boolean(uuid)
  });
}

export function useMemberLookups() {
  return useQuery({
    queryKey: memberQueryKeys.lookups(),
    queryFn: listMemberLookups
  });
}
