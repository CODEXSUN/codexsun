import { useQuery } from "@tanstack/react-query";
import { getMember, listMemberLookups, listMembersPage } from "./member.services";
import type { MemberColumnFilters } from "./member.types";

export const memberQueryKeys = {
  all: ["sportsclub", "members"] as const,
  list: (options: {
    page: number;
    pageSize?: number | undefined;
    search: string;
    status?: string | undefined;
    role?: string | undefined;
    columns?: string | undefined;
    columnFilters?: MemberColumnFilters | undefined;
  }) => ["sportsclub", "members", "list", options] as const,
  details: (uuid: string) => ["sportsclub", "members", "detail", uuid] as const,
  lookups: (search: string) => ["sportsclub", "members", "lookups", search] as const
};

export function useMembersPage(options: {
  page: number;
  pageSize?: number | undefined;
  search: string;
  status?: string | undefined;
  role?: string | undefined;
  columns?: string | undefined;
  columnFilters?: MemberColumnFilters | undefined;
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

export function useMemberLookups(search = "") {
  return useQuery({
    queryKey: memberQueryKeys.lookups(search),
    queryFn: () => listMemberLookups(search)
  });
}
