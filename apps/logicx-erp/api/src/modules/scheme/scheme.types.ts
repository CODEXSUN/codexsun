import type { ColumnType, Generated, Kysely } from "kysely";

export const logicxErpSchemePriorities = ["high", "medium", "low"] as const;
export type LogicxErpSchemePriority = (typeof logicxErpSchemePriorities)[number];

export const logicxErpSchemeStatuses = ["active", "inactive"] as const;
export type LogicxErpSchemeStatus = (typeof logicxErpSchemeStatuses)[number];

export const logicxErpSchemePermissions = [
  "logicx-erp.scheme.view",
  "logicx-erp.scheme.create",
  "logicx-erp.scheme.update",
  "logicx-erp.scheme.delete"
] as const;
export type LogicxErpSchemePermission = (typeof logicxErpSchemePermissions)[number];

export type LogicxErpSchemeActivityAction =
  "created" | "updated" | "activated" | "deactivated" | "deleted";

export type LogicxErpSchemeInput = {
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

export type LogicxErpSchemeWrite = Omit<LogicxErpSchemeInput, "salesId"> & {
  salesInternalId: number;
};

export type LogicxErpSchemeRecord = LogicxErpSchemeInput & {
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
  search?: string | undefined;
  status?: "all" | LogicxErpSchemeStatus | undefined;
  priority?: "all" | LogicxErpSchemePriority | undefined;
  claim?: "all" | "done" | "pending" | undefined;
};

export type LogicxErpSchemeActivityRecord = {
  id: string;
  action: LogicxErpSchemeActivityAction;
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

export type LogicxErpSchemeRequestContext = {
  actorEmail: string;
  authorize: (permission: LogicxErpSchemePermission) => Promise<void>;
  database: Kysely<LogicxErpSchemeDatabase>;
};

type ReadOnlyTimestamp = ColumnType<Date | string, never, never>;

export type LogicxErpSchemeRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  scheme_no: string;
  scheme_date: ColumnType<Date | string, string, string>;
  sales_id: number;
  priority: LogicxErpSchemePriority;
  support_value: number;
  brand_id: number;
  description: string;
  requested_by_user_id: number;
  approved_by_user_id: number | null;
  claim_done: ColumnType<boolean | number, boolean, boolean>;
  amount_realized: number | null;
  status: LogicxErpSchemeStatus;
  created_by: string;
  created_at: ReadOnlyTimestamp;
  updated_at: ReadOnlyTimestamp;
  deleted_at: ColumnType<Date | string | null, never, string | null>;
};

export type LogicxErpSchemeActivityRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  scheme_id: number;
  action: LogicxErpSchemeActivityAction;
  summary: string;
  status: Generated<string>;
  created_by: string;
  created_at: ReadOnlyTimestamp;
  updated_at: ReadOnlyTimestamp;
};

// Parent tables are read only to validate references and build relation responses.
export type LogicxErpSchemeDatabase = {
  logicx_erp_schemes: LogicxErpSchemeRow;
  logicx_erp_scheme_activity: LogicxErpSchemeActivityRow;
  billing_sales: {
    id: number;
    uuid: string;
    invoice_number: string;
    issued_on: ReadOnlyTimestamp;
    customer_id: number;
    amount: string | number;
    status: string;
    deleted_at: Date | string | null;
  };
  core_brands: { id: number; name: string; status: string };
  core_contacts: { id: number; name: string };
  app_users: { id: number; name: string; email: string; status: string };
};
