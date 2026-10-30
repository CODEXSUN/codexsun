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
  pageSize?: number | undefined;
  search: string;
  status?: string | undefined;
  columns?: string | undefined;
  columnFilters?: ProgramColumnFilters | undefined;
}): Promise<ProgramPage> {
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

export async function deleteProgram(
  uuid: string
): Promise<{ success: boolean }> {
  return sportsclubRequest<{ success: boolean }>(`/sportsclub/programs/${uuid}/force`, {
    method: "DELETE"
  });
}

export async function getProgramLookup(search = ""): Promise<ProgramLookup[]> {
  const query = new URLSearchParams({ search, page: "1" });
  const page = await sportsclubRequest<{ items: ProgramLookup[] }>(`/sportsclub/programs/lookups?${query}`);
  return page.items;
}
