export type EnquiryStatus = "new" | "contacted" | "enrolled" | "closed";

export type EnquirySavePayload = {
  name: string;
  phone: string;
  email?: string | null | undefined;
  programOfInterest?: string | null | undefined;
  preferredTiming?: string | null | undefined;
  message: string;
  status: EnquiryStatus;
  adminNotes?: string | null | undefined;
};

export type EnquiryRecord = EnquirySavePayload & {
  id: number;
  uuid: string;
  source?: string | null | undefined;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type EnquiryPage = {
  items: EnquiryRecord[];
  total: number;
};

export type EnquiryColumnFilters = {
  name?: string | undefined;
  phone?: string | undefined;
  status?: string | undefined;
  programOfInterest?: string | undefined;
};
