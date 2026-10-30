import { sportsclubRequest } from "../../sportsclub-request";
import type {
  SessionColumnFilters,
  SessionLookup,
  SessionPage,
  SessionRecord,
  SessionSavePayload
} from "./session.types";

export async function listSessionsPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: SessionColumnFilters;
}): Promise<SessionPage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    search: options.search
  });
  if (options.status && options.status !== "all") query.set("status", options.status);
  for (const [key, value] of Object.entries(options.columnFilters ?? {})) {
    if (value?.trim()) query.set(key, value.trim());
  }
  return sportsclubRequest<SessionPage>(`/sportsclub/sessions?${query}`);
}

export async function getSession(uuid: string): Promise<SessionRecord> {
  return sportsclubRequest<SessionRecord>(`/sportsclub/sessions/${uuid}`);
}

export async function createSession(payload: SessionSavePayload): Promise<SessionRecord> {
  return sportsclubRequest<SessionRecord>("/sportsclub/sessions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateSession(
  uuid: string,
  payload: SessionSavePayload,
  revision: number
): Promise<SessionRecord> {
  return sportsclubRequest<SessionRecord>(`/sportsclub/sessions/${uuid}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, revision })
  });
}

export async function listSessionLookups(search = ""): Promise<SessionLookup[]> {
  const query = new URLSearchParams({ search, page: "1" });
  const page = await sportsclubRequest<{ items: SessionLookup[] }>(`/sportsclub/sessions/lookups?${query}`);
  return page.items;
}
