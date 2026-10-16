export type ClosureStatus = "pending" | "approved" | "rejected";

export type ClosureRequest = {
  id: number;
  enquiryId: number;
  enquiryNo: number;
  title: string;
  contact: string | null;
  requester: string;
  requestedAt: string;
  status: ClosureStatus;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
};
