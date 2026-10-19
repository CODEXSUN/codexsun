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
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: MasterColumnFilters;
}): Promise<MasterPage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    search: options.search
  });
  if (options.status && options.status !== "all") query.set("status", options.status);
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

export async function suspendMaster(
  uuid: string,
  revision: number
): Promise<{ success: boolean; revision: number }> {
  return sportsclubRequest<{ success: boolean; revision: number }>(
    `/sportsclub/masters/${uuid}/suspend`,
    {
      method: "POST",
      body: JSON.stringify({ revision })
    }
  );
}

export async function restoreMaster(
  uuid: string,
  revision: number
): Promise<{ success: boolean; revision: number }> {
  return sportsclubRequest<{ success: boolean; revision: number }>(
    `/sportsclub/masters/${uuid}/restore`,
    {
      method: "POST",
      body: JSON.stringify({ revision })
    }
  );
}

export async function listMasterLookups(): Promise<MasterLookup[]> {
  return sportsclubRequest<MasterLookup[]>("/sportsclub/masters/lookups");
}
