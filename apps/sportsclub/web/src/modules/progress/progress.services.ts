import { sportsclubRequest } from "../../sportsclub-request";
import type {
  ProgressColumnFilters,
  ProgressPage,
  ProgressRecord,
  ProgressSavePayload
} from "./progress.types";

export async function listProgressPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: ProgressColumnFilters;
}): Promise<ProgressPage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    search: options.search
  });
  if (options.status && options.status !== "all") query.set("status", options.status);
  for (const [key, value] of Object.entries(options.columnFilters ?? {})) {
    if (value?.trim()) query.set(key, value.trim());
  }
  return sportsclubRequest<ProgressPage>(`/sportsclub/progress?${query}`);
}

export async function getProgress(uuid: string): Promise<ProgressRecord> {
  return sportsclubRequest<ProgressRecord>(`/sportsclub/progress/${uuid}`);
}

export async function recordProgress(payload: ProgressSavePayload): Promise<ProgressRecord> {
  return sportsclubRequest<ProgressRecord>("/sportsclub/progress", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateProgress(
  uuid: string,
  payload: ProgressSavePayload,
  revision: number
): Promise<ProgressRecord> {
  return sportsclubRequest<ProgressRecord>(`/sportsclub/progress/${uuid}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, revision })
  });
}
