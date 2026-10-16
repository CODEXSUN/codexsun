import { crmRequest } from "../../crm-request";
import type { ClosureRequest, ClosureStatus } from "./closure.types";

export async function listClosureRequests(status: ClosureStatus) {
  return crmRequest<{ items: ClosureRequest[] }>(`/crm/closure-requests?status=${status}`);
}

export async function getLatestEnquiryClosureRequest(enquiryId: string) {
  const result = await crmRequest<{ item: ClosureRequest | null }>(
    `/crm/enquiries/${encodeURIComponent(enquiryId)}/closure-requests/latest`
  );
  return result.item;
}

export function requestEnquiryClosure(enquiryId: string, note: string) {
  return crmRequest<ClosureRequest>(
    `/crm/enquiries/${encodeURIComponent(enquiryId)}/closure-requests`,
    { method: "POST", body: JSON.stringify({ note }) }
  );
}

export function reviewClosureRequest(id: number, decision: "approve" | "reject", note = "") {
  return crmRequest<ClosureRequest>(`/crm/closure-requests/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify({ decision, note })
  });
}
