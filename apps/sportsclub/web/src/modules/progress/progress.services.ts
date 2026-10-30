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
  for (const [key, value] of Object.entries(options.columnFilters ?? {}))
    if (value) query.set(key, value);
  return sportsclubRequest<ProgressPage>(`/sportsclub/progress?${query}`);
}
export async function getProgress(uuid: string): Promise<ProgressRecord> {
  return sportsclubRequest<ProgressRecord>(`/sportsclub/progress/${uuid}`);
}
export async function recordProgress(payload: ProgressSavePayload): Promise<ProgressRecord> {
  const { memberUuid, ...evaluation } = payload;
  return sportsclubRequest<ProgressRecord>(`/sportsclub/progress/member/${memberUuid}`, {
    method: "POST",
    body: JSON.stringify(evaluation)
  });
}
export async function updateProgress(
  uuid: string,
  payload: ProgressSavePayload
): Promise<ProgressRecord> {
  const { memberUuid: _memberUuid, ...evaluation } = payload;
  return sportsclubRequest<ProgressRecord>(`/sportsclub/progress/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(evaluation)
  });
}

export type ProgressMemberOption = { uuid: string; name: string; role: string; status: string };
export type ProgressProgramOption = { uuid: string; name: string; status: string };
type LookupPage<T> = { items: T[]; total: number };
export async function searchProgressMembers(
  search: string
): Promise<LookupPage<ProgressMemberOption>> {
  return sportsclubRequest<LookupPage<ProgressMemberOption>>(
    `/sportsclub/members/lookups?search=${encodeURIComponent(search)}&page=1`
  );
}
export async function searchProgressPrograms(
  search: string
): Promise<LookupPage<ProgressProgramOption>> {
  return sportsclubRequest<LookupPage<ProgressProgramOption>>(
    `/sportsclub/programs/lookups?search=${encodeURIComponent(search)}&page=1`
  );
}
export async function getProgressMember(uuid: string): Promise<ProgressMemberOption> {
  return sportsclubRequest<ProgressMemberOption>(`/sportsclub/members/${uuid}`);
}
export async function getProgressProgram(uuid: string): Promise<ProgressProgramOption> {
  return sportsclubRequest<ProgressProgramOption>(`/sportsclub/programs/${uuid}`);
}
