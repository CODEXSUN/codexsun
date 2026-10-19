import { sportsclubRequest } from "../../sportsclub-request";
import type {
  MasterColumnFilters,
  MasterLookup,
  MasterPage,
  MasterRecord,
  MasterSavePayload
} from "./master.types";

export async function listMastersPage(options: {
  page: number;
  pageSize?: number | undefined;
  search: string;
  status?: string | undefined;
  columns?: string | undefined;
  columnFilters?: MasterColumnFilters | undefined;
}): Promise<MasterPage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize ?? 100),
    search: options.search
  });
  if (options.status && options.status !== "all") query.set("status", options.status);
  if (options.columns) query.set("columns", options.columns);
  for (const [key, value] of Object.entries(options.columnFilters ?? {})) {
    if (value?.trim()) query.set(key, value.trim());
  }
  return sportsclubRequest<MasterPage>(`/sportsclub/masters?${query}`);
}

export async function getMaster(uuid: string): Promise<MasterRecord> {
  return sportsclubRequest<MasterRecord>(`/sportsclub/masters/${uuid}`);
}

export async function createMaster(payload: MasterSavePayload): Promise<MasterRecord> {
  return sportsclubRequest<MasterRecord>("/sportsclub/masters", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateMaster(
  uuid: string,
  payload: MasterSavePayload,
  revision: number
): Promise<MasterRecord> {
  return sportsclubRequest<MasterRecord>(`/sportsclub/masters/${uuid}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, revision })
  });
}

export async function deleteMaster(
  uuid: string
): Promise<{ success: boolean }> {
  return sportsclubRequest<{ success: boolean }>(`/sportsclub/masters/${uuid}/force`, {
    method: "DELETE"
  });
}

export async function getMasterLookup(search = ""): Promise<MasterLookup[]> {
  const query = new URLSearchParams({ search, page: "1" });
  const page = await sportsclubRequest<{ items: MasterLookup[] }>(`/sportsclub/masters/lookups?${query}`);
  return page.items;
}
