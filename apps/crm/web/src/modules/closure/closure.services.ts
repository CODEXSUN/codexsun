import { crmRequest } from "../../crm-request";
import type { ClosureRequest, ClosureStatus } from "./closure.types";

export async function listClosureRequests(status: ClosureStatus) {
  return crmRequest<{ items: ClosureRequest[] }>(`/crm/closure-requests?status=${status}`);
}

export function getEnquiryClosureState(enquiryId: string) {
  return crmRequest<{ item: ClosureRequest | null; canReview: boolean }>(
    `/crm/enquiries/${encodeURIComponent(enquiryId)}/closure-requests/latest`
  );
}

export async function getLatestEnquiryClosureRequest(enquiryId: string) {
  return (await getEnquiryClosureState(enquiryId)).item;
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
