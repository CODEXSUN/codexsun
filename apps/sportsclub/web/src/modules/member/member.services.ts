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

export type MemberPhoto = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  contentBase64: string;
  updatedAt: string;
};

export async function getMemberPhoto(uuid: string): Promise<MemberPhoto | null> {
  try {
    return await sportsclubRequest<MemberPhoto>(`/sportsclub/members/${uuid}/photo`);
  } catch (error) {
    if (error instanceof Error && error.message === "Student photo not found.") return null;
    throw error;
  }
}

export async function uploadMemberPhoto(
  uuid: string,
  file: File
): Promise<Pick<MemberPhoto, "mimeType" | "updatedAt">> {
  const contentBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string" || !result.includes(","))
        reject(new Error("Could not read the selected photo."));
      else resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the selected photo."));
    reader.readAsDataURL(file);
  });
  return sportsclubRequest<Pick<MemberPhoto, "mimeType" | "updatedAt">>(
    `/sportsclub/members/${uuid}/photo`,
    {
      method: "PUT",
      body: JSON.stringify({ mimeType: file.type, contentBase64 })
    }
  );
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
  const page = await sportsclubRequest<{ items: MemberLookup[] }>(
    `/sportsclub/members/lookups?${query}`
  );
  return page.items;
}
