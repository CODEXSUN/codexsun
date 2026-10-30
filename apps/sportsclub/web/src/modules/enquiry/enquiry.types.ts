export type EnquiryStatus = "new" | "in_progress" | "resolved" | "spam" | "trash";
export type EnquirySavePayload = {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
  consent: boolean;
  status: EnquiryStatus;
  notes: string;
  revision: number;
};
export type EnquiryRecord = EnquirySavePayload & {
  uuid: string;
  createdAt: string;
  updatedAt: string;
};
export type EnquiryPage = {
  items: EnquiryRecord[];
  total: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
};
export type EnquiryColumnFilters = { status?: EnquiryStatus };
