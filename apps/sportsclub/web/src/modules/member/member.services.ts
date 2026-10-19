import { sportsclubRequest } from "../../sportsclub-request";
import type {
  MemberColumnFilters,
  MemberLookup,
  MemberPage,
  MemberRecord,
  MemberSavePayload
} from "./member.types";

export async function listMembersPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: MemberColumnFilters;
}): Promise<MemberPage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    search: options.search
  });
  if (options.status && options.status !== "all") query.set("status", options.status);
  for (const [key, value] of Object.entries(options.columnFilters ?? {})) {
    if (value?.trim()) query.set(key, value.trim());
  }
  return sportsclubRequest<MemberPage>(`/sportsclub/members?${query}`);
}

export async function getMember(uuid: string): Promise<MemberRecord> {
  return sportsclubRequest<MemberRecord>(`/sportsclub/members/${uuid}`);
}

export async function createMember(payload: MemberSavePayload): Promise<MemberRecord> {
  return sportsclubRequest<MemberRecord>("/sportsclub/members", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateMember(
  uuid: string,
  payload: MemberSavePayload,
  revision: number
): Promise<MemberRecord> {
  return sportsclubRequest<MemberRecord>(`/sportsclub/members/${uuid}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, revision })
  });
}

export async function suspendMember(
  uuid: string,
  revision: number
): Promise<{ success: boolean; revision: number }> {
  return sportsclubRequest<{ success: boolean; revision: number }>(
    `/sportsclub/members/${uuid}/suspend`,
    {
      method: "POST",
      body: JSON.stringify({ revision })
    }
  );
}

export async function restoreMember(
  uuid: string,
  revision: number
): Promise<{ success: boolean; revision: number }> {
  return sportsclubRequest<{ success: boolean; revision: number }>(
    `/sportsclub/members/${uuid}/restore`,
    {
      method: "POST",
      body: JSON.stringify({ revision })
    }
  );
}

export async function listMemberLookups(): Promise<MemberLookup[]> {
  return sportsclubRequest<MemberLookup[]>("/sportsclub/members/lookups");
}
