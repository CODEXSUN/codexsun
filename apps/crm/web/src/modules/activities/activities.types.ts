export type ActivityItem = {
  id: number;
  enquiryId: number;
  enquiryNo: number;
  contact: string;
  action: string;
  details: string;
  actor: string;
  allocatedTo: string | null;
  listIn: string | null;
  status: string;
  statusCode: string;
  createdAt: string;
};

export type ActivityPage = { items: ActivityItem[]; total: number };

export type ActivityFilters = {
  page: number;
  pageSize: number;
  search: string;
  contact: string;
  enquiry: string;
  allocatedTo: string;
  listIn: string;
  status: string;
  action: string;
  actor: string;
};

export type ActivityColumnFilter = keyof Pick<
  ActivityFilters,
  "contact" | "enquiry" | "allocatedTo" | "listIn" | "action" | "actor"
>;
