import type { Note, NoteSavePayload, NoteStatus } from "./note.types";

const API_BASE_URL = requiredRuntimeValue("VITE_PLATFORM_API_URL");

export function listNotes(search = "", status: NoteStatus | "all" = "all") {
  const parameters = new URLSearchParams();
  if (search.trim()) parameters.set("search", search.trim());
  if (status !== "all") parameters.set("status", status);
  const suffix = parameters.size ? `?${parameters.toString()}` : "";
  return notesRequest<Note[]>(`/notes/notes${suffix}`);
}

export function getNote(id: string) {
  return notesRequest<Note>(`/notes/notes/${encodeURIComponent(id)}`);
}

export function createNote(payload: NoteSavePayload) {
  return notesRequest<Note>("/notes/notes", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function updateNote(id: string, payload: NoteSavePayload) {
  return notesRequest<Note>(`/notes/notes/${encodeURIComponent(id)}`, {
    body: JSON.stringify(payload),
    method: "PUT"
  });
}

export function suspendNote(id: string) {
  return notesRequest<Note>(`/notes/notes/${encodeURIComponent(id)}/suspend`, { method: "POST" });
}

export function restoreNote(id: string) {
  return notesRequest<Note>(`/notes/notes/${encodeURIComponent(id)}/restore`, { method: "POST" });
}

export function forceDeleteNote(id: string) {
  return notesRequest<{ uuid: string }>(`/notes/notes/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

async function notesRequest<T>(path: string, init: RequestInit = {}) {
  const tenantId = sessionStorage.getItem("codexsun_tenant_id");
  const tenantDatabase = sessionStorage.getItem("codexsun_tenant_db_name");
  const companyId = sessionStorage.getItem("codexsun.tenant.company-id");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...(tenantDatabase ? { "x-tenant-db": tenantDatabase } : {}),
      ...(companyId ? { "x-company-id": companyId } : {}),
      ...(init.headers ?? {})
    }
  });
  const body = (await response.json()) as { data?: T; error?: { message?: string } };
  if (!response.ok)
    throw new Error(body.error?.message ?? `Notes request failed: ${response.status}`);
  return body.data as T;
}

function requiredRuntimeValue(name: string) {
  const runtime = (
    window as Window & {
      __CODEXSUN_RUNTIME_CONFIG__?: Readonly<Record<string, string>>;
    }
  ).__CODEXSUN_RUNTIME_CONFIG__;
  const value = runtime?.[name]?.trim();
  if (!value) throw new Error(`Missing required runtime configuration: ${name}`);
  return value;
}
