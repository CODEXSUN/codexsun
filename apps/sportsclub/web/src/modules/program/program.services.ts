import { sportsclubRequest } from "../../sportsclub-request";
import type {
  ProgramColumnFilters,
  ProgramLookup,
  ProgramPage,
  ProgramRecord,
  ProgramSavePayload
} from "./program.types";

export async function listProgramsPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: ProgramColumnFilters;
}): Promise<ProgramPage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    search: options.search
  });
  if (options.status && options.status !== "all") query.set("status", options.status);
  for (const [key, value] of Object.entries(options.columnFilters ?? {})) {
    if (value?.trim()) query.set(key, value.trim());
  }
  return sportsclubRequest<ProgramPage>(`/sportsclub/programs?${query}`);
}

export async function getProgram(uuid: string): Promise<ProgramRecord> {
  return sportsclubRequest<ProgramRecord>(`/sportsclub/programs/${uuid}`);
}

export async function createProgram(payload: ProgramSavePayload): Promise<ProgramRecord> {
  return sportsclubRequest<ProgramRecord>("/sportsclub/programs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateProgram(
  uuid: string,
  payload: ProgramSavePayload,
  revision: number
): Promise<ProgramRecord> {
  return sportsclubRequest<ProgramRecord>(`/sportsclub/programs/${uuid}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, revision })
  });
}

export async function suspendProgram(
  uuid: string,
  revision: number
): Promise<{ success: boolean; revision: number }> {
  return sportsclubRequest<{ success: boolean; revision: number }>(
    `/sportsclub/programs/${uuid}/suspend`,
    {
      method: "POST",
      body: JSON.stringify({ revision })
    }
  );
}

export async function restoreProgram(
  uuid: string,
  revision: number
): Promise<{ success: boolean; revision: number }> {
  return sportsclubRequest<{ success: boolean; revision: number }>(
    `/sportsclub/programs/${uuid}/restore`,
    {
      method: "POST",
      body: JSON.stringify({ revision })
    }
  );
}

export async function listProgramLookups(): Promise<ProgramLookup[]> {
  return sportsclubRequest<ProgramLookup[]>("/sportsclub/programs/lookups");
}
