import type {
  CodexsunContext,
  RequirementActivity,
  RequirementDraftInput,
  RequirementRecord,
  RequirementsFilter,
  RequirementsPage
} from "./requirements.types";
export interface CodexsunGateway {
  sessionKey: string;
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
}

export function createRequirementClientKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const value = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}
export function getCodexsunContext(gateway: CodexsunGateway) {
  return gateway.get<CodexsunContext>("/codexsun/context");
}
export function listRequirements(gateway: CodexsunGateway, filter: RequirementsFilter) {
  const query = new URLSearchParams({
    page: String(filter.page),
    pageSize: String(filter.pageSize),
    search: filter.search
  });
  if (filter.status) query.set("status", filter.status);
  return gateway.get<RequirementsPage>(`/codexsun/requirements?${query}`);
}
export function getRequirementActivity(gateway: CodexsunGateway, uuid: string) {
  return gateway.get<RequirementActivity[]>(`/codexsun/requirements/${uuid}/activity`);
}
export function createRequirement(gateway: CodexsunGateway, input: RequirementDraftInput) {
  return gateway.post<RequirementRecord>("/codexsun/requirements", input);
}
export function updateRequirement(
  gateway: CodexsunGateway,
  record: RequirementRecord,
  input: RequirementDraftInput
) {
  return gateway.patch<RequirementRecord>(`/codexsun/requirements/${record.uuid}`, {
    revision: record.revision,
    title: input.title,
    description: input.description,
    priority: input.priority
  });
}
export function submitRequirement(gateway: CodexsunGateway, record: RequirementRecord) {
  return gateway.post<RequirementRecord>(`/codexsun/requirements/${record.uuid}/submit`, {
    revision: record.revision
  });
}
export function decideRequirement(
  gateway: CodexsunGateway,
  record: RequirementRecord,
  decision: "approved" | "rejected",
  note: string
) {
  return gateway.post<RequirementRecord>(`/codexsun/requirements/${record.uuid}/decision`, {
    revision: record.revision,
    decision,
    note
  });
}
