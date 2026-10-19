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
  pageSize?: number | undefined;
  search: string;
  status?: string | undefined;
  role?: string | undefined;
  columns?: string | undefined;
  columnFilters?: MemberColumnFilters | undefined;
}): Promise<MemberPage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize ?? 100),
    search: options.search
  });
  if (options.status && options.status !== "all") query.set("status", options.status);
  if (options.role && options.role !== "all") query.set("role", options.role);
  if (options.columns) query.set("columns", options.columns);
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

export async function updateMemberProgress(
  uuid: string,
  progressNote: string,
  revision: number
): Promise<MemberRecord> {
  return sportsclubRequest<MemberRecord>(`/sportsclub/members/${uuid}/progress`, {
    method: "PUT",
    body: JSON.stringify({ progressNote, revision })
  });
}

export async function listMemberLookups(search = ""): Promise<MemberLookup[]> {
  const query = new URLSearchParams({ search, page: "1" });
  const page = await sportsclubRequest<{ items: MemberLookup[] }>(`/sportsclub/members/lookups?${query}`);
  return page.items;
}
