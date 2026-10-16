import { AppError } from "@codexsun/framework/errors";
import type { EnquiryListOptions } from "./enquiry.types.js";
import { EnquiryService } from "./enquiry.service.js";
import { localViewRecord } from "./enquiry.view-model.js";

export type LiveEnquiryQuery = {
  scope: "all" | "assigned" | "created";
  page: number;
  pageSize: number;
  search: string;
  mobile?: string | undefined;
  searchCustomer?: string | undefined;
  searchDetails?: string | undefined;
  searchListIn?: string | undefined;
  searchDueDate?: string | undefined;
  searchPriority?: string | undefined;
  searchCreator?: string | undefined;
  searchAssignedTo?: string | undefined;
  searchStatus?: string | undefined;
  status?: string | undefined;
  group?: string | undefined;
  creator?: string | undefined;
  assignee?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
};

export type LiveEnquiryRecord = {
  name: string;
  title: string;
  details: string;
  customer: string | null;
  mobile: string | null;
  date: string | null;
  dueDate: string | null;
  group: string | null;
  creator: string | null;
  assignee: string | null;
  priority: string | null;
  status: string | null;
  statusDetails: string | null;
  createdAt: string | null;
  modifiedAt: string | null;
  creatorCode?: string | null;
  assigneeCode?: string | null;
  messages?: Array<{
    name: string;
    body: string;
    parentName: string | null;
    createdBy: string | null;
    createdAt: string | null;
  }>;
  activity?: Array<{
    name: string;
    action: string;
    details: string;
    createdBy: string;
    createdAt: string;
  }>;
  canDelete?: boolean;
};

export type LiveEnquiryInput = {
  title: string;
  details: string;
  customer: string | null;
  mobile: string;
  date: string;
  dueDate: string | null;
  group: string | null;
  assigneeCode: string | null;
  priority: string;
  status: string;
  statusDetails: string | null;
};

export type LiveEnquiryOptions = {
  groups: string[];
  statuses: string[];
  employees: Array<{ code: string; name: string }>;
  customers: Array<{ code: string; name: string }>;
  suppliers: Array<{ code: string; name: string }>;
};
export type LiveEnquiryJob = {
  name: string;
  createdAt?: string | null;
  employee: string;
  startTime: string;
  stopTime: string | null;
  status: string;
  hours: number;
  totalCost: number;
  ratePerHour: number;
};
export type LiveEnquiryJobInput = {
  employee: string;
  startTime: string;
  stopTime: string | null;
  ratePerHour: number;
  status: "Running" | "Completed" | "Cancelled";
};
export type LiveEnquiryEstimate = {
  name: string;
  date: string;
  itemName: string;
  supplier: string;
  price: number;
};
export type LiveEnquiryEstimateInput = Omit<LiveEnquiryEstimate, "name">;
export type LiveEnquiryPatch = {
  [Key in keyof LiveEnquiryInput]?: LiveEnquiryInput[Key] | undefined;
};

export type LiveEnquiryPage = {
  source: "frappe";
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number;
  statusCounts: Array<{ code: string; count: number }>;
  items: LiveEnquiryRecord[];
};

export type EnquiryRemoteSource = {
  provider(): Promise<"local" | "frappe">;
  list(query: LiveEnquiryQuery): Promise<LiveEnquiryPage>;
  get(name: string): Promise<LiveEnquiryRecord>;
  options(): Promise<LiveEnquiryOptions>;
  createOption?(
    kind: "list-in" | "status" | "priority",
    name: string
  ): Promise<{ id: string; name: string; code: string }>;
  create(input: LiveEnquiryInput): Promise<LiveEnquiryRecord>;
  update(name: string, input: LiveEnquiryPatch): Promise<LiveEnquiryRecord>;
  addMessage(name: string, body: string, parentName: string | null): Promise<LiveEnquiryRecord>;
  suspendMessage(name: string, messageName: string): Promise<LiveEnquiryRecord>;
  openNewCall(name: string): Promise<LiveEnquiryRecord>;
  delete(name: string): Promise<{ deleted: true }>;
  jobs(name: string): Promise<LiveEnquiryJob[]>;
  startJob(name: string): Promise<LiveEnquiryJob>;
  stopJob(name: string, jobName: string): Promise<LiveEnquiryJob>;
  saveJob(name: string, input: LiveEnquiryJobInput, jobName?: string): Promise<LiveEnquiryJob>;
  estimates(name: string): Promise<LiveEnquiryEstimate[]>;
  saveEstimate(
    name: string,
    input: LiveEnquiryEstimateInput,
    estimateName?: string
  ): Promise<LiveEnquiryEstimate>;
  report(query: {
    view: "list-in" | "creator" | "assignee" | "status";
    fromDate?: string | undefined;
    toDate?: string | undefined;
    assignee?: string | undefined;
  }): Promise<Array<{ group: string | null; status: string | null; count: number }>>;
  summary(
    today: string
  ): Promise<{ allCount: number; assigned: LiveScopeSummary; created: LiveScopeSummary }>;
};

export type LiveScopeSummary = {
  total: number;
  statusCounts: Array<{ code: string; count: number }>;
  priorityCounts: Array<{ code: string; count: number }>;
  updated7?: number;
  updated30?: number;
  created7?: number;
  created30?: number;
  oldestActiveDays?: number | null;
};

type ReadQuery = Omit<EnquiryListOptions, "actorEmail" | "actorUserId" | "canViewAll">;

export class EnquiryReadService {
  constructor(private readonly local: EnquiryService) {}

  async list(query: ReadQuery) {
    for (const value of [query.listInId, query.assignedUserId]) {
      if (value && value !== "none" && !/^[1-9]\d*$/.test(value))
        throw AppError.validation("A Local enquiry filter has an invalid identifier.");
    }
    const page = await this.local.listPage(query);
    return { source: "local" as const, ...page, items: page.items.map(localViewRecord) };
  }
}
