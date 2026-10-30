export type FrappeActivity = {
  name: string;
  enquiry: string | null;
  details: string;
  mode: string;
  createdAt: string | null;
  localEnquiryId: number | null;
  localActivityId: number | null;
};
export type FrappeActivityPage = {
  items: FrappeActivity[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};
