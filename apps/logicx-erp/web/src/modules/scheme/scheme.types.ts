export type LogicxErpSchemePriority = "high" | "medium" | "low";
export type LogicxErpSchemeStatus = "active" | "inactive";

export type LogicxErpSchemeSavePayload = {
  schemeDate: string;
  salesId: string;
  priority: LogicxErpSchemePriority;
  supportValue: number;
  brandId: number;
  description: string;
  requestedByUserId: number;
  approvedByUserId: number | null;
  claimDone: boolean;
  amountRealized: number | null;
  status: LogicxErpSchemeStatus;
};

export type LogicxErpSchemeRecord = LogicxErpSchemeSavePayload & {
  id: string;
  schemeNo: string;
  invoiceNumber: string;
  brandName: string;
  requestedByName: string;
  approvedByName: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type LogicxErpSchemeFilters = {
  search: string;
  status: "all" | LogicxErpSchemeStatus;
  priority: "all" | LogicxErpSchemePriority;
  claim: "all" | "done" | "pending";
};

export type LogicxErpSchemeActivity = {
  id: string;
  action: "created" | "updated" | "activated" | "deactivated" | "deleted";
  summary: string;
  actorEmail: string;
  createdAt: string;
};

export type LogicxErpSchemeLookups = {
  brands: Array<{ id: number; name: string }>;
  users: Array<{ id: number; name: string; email: string }>;
};

export type LogicxErpSchemeInvoiceOption = {
  id: string;
  invoiceNumber: string;
  issuedOn: string;
  customerName: string;
  amount: number;
};

// Form state keeps raw control values; the schema turns them into a save payload.
export type LogicxErpSchemeDraft = {
  schemeDate: string;
  salesId: string;
  invoiceNumber: string;
  priority: LogicxErpSchemePriority | "";
  supportValue: string;
  brandId: string;
  description: string;
  requestedByUserId: string;
  approvedByUserId: string;
  claimDone: boolean;
  amountRealized: string;
  status: LogicxErpSchemeStatus;
};
