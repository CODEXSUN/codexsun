import { AppError } from "@codexsun/framework/errors";
import { requestFrappe, type FrappeSettings } from "../connection/index.js";

export async function resolveEnquiryStatus(settings: FrappeSettings, localName: string) {
  const query = new URLSearchParams({ fields: JSON.stringify(["name"]), limit_page_length: "500" });
  const response = await requestFrappe<{ data?: Array<{ name: string }> }>(
    `/api/resource/Enquiry%20Status?${query}`,
    "GET",
    settings
  );
  const names = response.data?.map((row) => row.name) ?? [];
  const exact = names.find((name) => name.toLowerCase() === localName.trim().toLowerCase());
  if (exact) return exact;
  const legacy: Record<string, string> = {
    open: "Pending",
    "long hold": "Hold"
  };
  const fallback = legacy[localName.trim().toLowerCase()];
  if (fallback && names.includes(fallback)) return fallback;
  throw AppError.conflict(
    `Frappe has no Enquiry Status matching ${localName}. Verify the status mapping before export.`
  );
}
