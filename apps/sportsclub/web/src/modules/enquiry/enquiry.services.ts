import { sportsclubRequest } from "../../sportsclub-request";
import type {
  EnquiryColumnFilters,
  EnquiryPage,
  EnquiryRecord,
  EnquirySavePayload
} from "./enquiry.types";
export async function listEnquiriesPage(options: {
  page: number;
  pageSize: number;
  search: string;
  status?: string;
  columnFilters?: EnquiryColumnFilters;
}): Promise<EnquiryPage> {
  const query = new URLSearchParams({
    page: String(options.page),
    pageSize: String(options.pageSize),
    search: options.search
  });
  if (options.status && options.status !== "all") query.set("status", options.status);
  for (const [key, value] of Object.entries(options.columnFilters ?? {}))
    if (value) query.set(key, value);
  return sportsclubRequest<EnquiryPage>(`/sportsclub/enquiries?${query}`);
}
export async function getEnquiry(uuid: string): Promise<EnquiryRecord> {
  return sportsclubRequest<EnquiryRecord>(`/sportsclub/enquiries/${uuid}`);
}
export async function createEnquiry(payload: EnquirySavePayload): Promise<EnquiryRecord> {
  return sportsclubRequest<EnquiryRecord>("/sportsclub/enquiries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
export async function updateEnquiry(
  uuid: string,
  payload: EnquirySavePayload
): Promise<EnquiryRecord> {
  return sportsclubRequest<EnquiryRecord>(`/sportsclub/enquiries/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
export async function deleteEnquiry(uuid: string): Promise<{ success: boolean }> {
  return sportsclubRequest<{ success: boolean }>(`/sportsclub/enquiries/${uuid}/force`, {
    method: "DELETE"
  });
}
