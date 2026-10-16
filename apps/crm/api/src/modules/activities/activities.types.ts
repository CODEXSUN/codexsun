import type { EnquiryDatabase } from "../enquiry/index.js";

export type ActivitiesDatabase = EnquiryDatabase & {
  app_users: { id: number; name: string; email: string };
  core_contacts: { id: number; name: string; primary_phone: string | null };
};

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
  actorEmail: string;
  actorUserId: number | null;
  canViewAll: boolean;
};

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
