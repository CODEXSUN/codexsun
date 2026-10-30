import { AppError } from "@codexsun/framework/errors";
import type { Kysely } from "kysely";
import { FrappeConnectionRepository } from "./connection.repository.js";
import { requestFrappe } from "./connection.service.js";
import { aggregateFrappeEnquiries } from "./connection.aggregate-enquiries.js";
import { listEnquiryJobComments } from "./connection.job-comments.js";
import type { FrappeDatabase, FrappeSettings } from "./connection.types.js";

const fields = [
  "name",
  "title",
  "enquiry_details",
  "customer",
  "mobile",
  "date",
  "due_date",
  "group",
  "user_employee",
  "assigned_to_employee",
  "priority",
  "status",
  "status_details",
  "creation",
  "modified"
];

type RemoteEnquiry = {
  name: string;
  title?: string | null;
  enquiry_details?: string | null;
  customer?: string | null;
  mobile?: string | null;
  date?: string | null;
  due_date?: string | null;
  group?: string | null;
  user_employee?: string | null;
  assigned_to_employee?: string | null;
  priority?: string | null;
  status?: string | null;
  status_details?: string | null;
  creation?: string | null;
  modified?: string | null;
};
type RemoteEmployee = {
  name: string;
  employee_name?: string | null;
  user_id?: string | null;
};

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

export async function listLiveFrappeEnquiries(
  database: Kysely<FrappeDatabase>,
  defaults: FrappeSettings,
  encryptionSecret: string,
  query: LiveEnquiryQuery,
  employeeCode: string | null,
  canViewAll: boolean
) {
  const repository = new FrappeConnectionRepository(database);
  if ((await repository.provider("crm.enquiries")) !== "frappe")
    throw AppError.conflict("CRM Enquiries is set to Local.");
  const saved = await repository.credentials(encryptionSecret);
  if (!saved || saved.row.verification_status !== "verified" || !saved.settings.enabled)
    throw AppError.conflict("The live Frappe connection is not verified and enabled.");
  const filters: Array<[string, string, string]> = [];
  if (query.scope !== "all" || !canViewAll) {
    if (!employeeCode)
      throw AppError.forbidden("Map this CRM user to a Frappe employee to view live enquiries.");
    if (query.scope !== "all")
      filters.push([
        query.scope === "assigned" ? "assigned_to_employee" : "user_employee",
        "=",
        employeeCode
      ]);
  }
  const canSearchAcrossFields = canViewAll || query.scope !== "all";
  const searchFilters: Array<[string, string, string]> =
    query.search && canSearchAcrossFields
      ? ["name", "title", "enquiry_details", "customer", "mobile"].map((field) => [
          field,
          "like",
          `%${query.search}%`
        ])
      : [];
  if (query.search && !canSearchAcrossFields) filters.push(["title", "like", `%${query.search}%`]);
  if (query.mobile) filters.push(["mobile", "like", `%${query.mobile}%`]);
  if (query.searchCustomer) filters.push(["customer", "like", `%${query.searchCustomer}%`]);
  if (query.searchDetails) filters.push(["enquiry_details", "like", `%${query.searchDetails}%`]);
  if (query.searchListIn) filters.push(["group", "like", `%${query.searchListIn}%`]);
  if (query.searchDueDate)
    filters.push(["due_date", "like", `%${searchDate(query.searchDueDate)}%`]);
  if (query.searchPriority) filters.push(["priority", "like", `%${query.searchPriority}%`]);
  if (query.searchCreator) filters.push(["user_employee", "like", `%${query.searchCreator}%`]);
  if (query.searchAssignedTo)
    filters.push(["assigned_to_employee", "like", `%${query.searchAssignedTo}%`]);
  if (query.searchStatus) filters.push(["status", "like", `%${query.searchStatus}%`]);
  if (query.group)
    filters.push([
      "group",
      query.group === "none" ? "is" : "=",
      query.group === "none" ? "not set" : query.group
    ]);
  if (query.creator)
    filters.push([
      "user_employee",
      query.creator === "none" ? "is" : "=",
      query.creator === "none" ? "not set" : query.creator
    ]);
  if (query.assignee)
    filters.push([
      "assigned_to_employee",
      query.assignee === "none" ? "is" : "=",
      query.assignee === "none" ? "not set" : query.assignee
    ]);
  if (query.fromDate) filters.push(["date", ">=", query.fromDate]);
  if (query.toDate) filters.push(["date", "<=", query.toDate]);
  const groupedStatuses = await aggregateFrappeEnquiries(
    saved.settings ?? defaults,
    ["status"],
    filters,
    employeeCode,
    canViewAll,
    searchFilters
  );
  const statusCounts = groupedStatuses.map((row) => ({
    code: row.status ? String(row.status) : "none",
    count: row.count
  }));
  const selectedStatuses = statusCounts.filter((row) =>
    matchesStatus(row.code, query.status ?? "all")
  );
  const total = selectedStatuses.reduce((sum, row) => sum + row.count, 0);
  if (query.status && selectedStatuses.length === 0)
    return {
      source: "frappe" as const,
      page: query.page,
      pageSize: query.pageSize,
      hasMore: false,
      total: 0,
      statusCounts,
      items: []
    };
  const listFilters: Array<[string, string, string | string[]]> = [...filters];
  if (query.status === "none") listFilters.push(["status", "is", "not set"]);
  else if (query.status && selectedStatuses.length === 1)
    listFilters.push(["status", "=", selectedStatuses[0]!.code]);
  else if (query.status)
    listFilters.push(["status", "in", selectedStatuses.map((row) => row.code)]);
  const params = new URLSearchParams({
    fields: JSON.stringify(fields),
    filters: JSON.stringify(listFilters),
    limit_start: String((query.page - 1) * query.pageSize),
    limit_page_length: String(query.pageSize + 1),
    order_by: "creation desc"
  });
  if (searchFilters.length) params.set("or_filters", JSON.stringify(searchFilters));
  else if (query.scope === "all" && !canViewAll)
    params.set(
      "or_filters",
      JSON.stringify([
        ["assigned_to_employee", "=", employeeCode],
        ["user_employee", "=", employeeCode]
      ])
    );
  const response = await requestFrappe<{ data?: RemoteEnquiry[] }>(
    `/api/resource/Enquiry?${params}`,
    "GET",
    saved.settings ?? defaults
  );
  if (!Array.isArray(response.data))
    throw new AppError({
      code: "FRAPPE_RESPONSE_INVALID",
      message: "Frappe did not return an enquiry list.",
      statusCode: 502
    });
  const remote = response.data;
  const visible = remote.slice(0, query.pageSize);
  const employeeNames = await loadEmployeeNames(saved.settings ?? defaults, visible);
  const comments = await listEnquiryJobComments(
    saved.settings ?? defaults,
    visible.map((item) => item.name)
  );
  const commentsByEnquiry = new Map<string, typeof comments>();
  for (const comment of comments) {
    if (!comment.job_id || comment.job_type !== "Enquiry") continue;
    const items = commentsByEnquiry.get(comment.job_id) ?? [];
    items.push(comment);
    commentsByEnquiry.set(comment.job_id, items);
  }
  return {
    source: "frappe" as const,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: remote.length > query.pageSize,
    total,
    statusCounts,
    items: visible.map((item) =>
      mapLiveEnquiry(item, employeeNames, commentsByEnquiry.get(item.name) ?? [])
    )
  };
}

export async function getLiveFrappeEnquiry(
  database: Kysely<FrappeDatabase>,
  defaults: FrappeSettings,
  encryptionSecret: string,
  name: string,
  employeeCode: string | null,
  canViewAll: boolean
) {
  const repository = new FrappeConnectionRepository(database);
  if ((await repository.provider("crm.enquiries")) !== "frappe")
    throw AppError.conflict("CRM Enquiries is set to Local.");
  const saved = await repository.credentials(encryptionSecret);
  if (!saved || saved.row.verification_status !== "verified" || !saved.settings.enabled)
    throw AppError.conflict("The live Frappe connection is not verified and enabled.");
  if (!canViewAll && !employeeCode)
    throw AppError.forbidden("Map this CRM user to a Frappe employee to view live enquiries.");
  const settings = saved.settings ?? defaults;
  const response = await requestFrappe<{ data?: RemoteEnquiry }>(
    `/api/resource/Enquiry/${encodeURIComponent(name)}`,
    "GET",
    settings
  );
  const record = response.data;
  if (!record || record.name !== name) throw AppError.notFound("Enquiry was not found.");
  if (
    !canViewAll &&
    record.user_employee !== employeeCode &&
    record.assigned_to_employee !== employeeCode
  )
    throw AppError.forbidden("You cannot view this enquiry.");
  const comments = await listEnquiryJobComments(settings, [name]);
  const employeeNames = await loadEmployeeNames(settings, [record]);
  return {
    ...mapLiveEnquiry(record, employeeNames, comments),
    activity: await loadActivity(settings, name),
    canDelete: canViewAll
  };
}

type DocInfo = {
  user_info?: Record<string, { fullname?: string }>;
  versions?: Array<{ name?: string; owner?: string; creation?: string; data?: string }>;
  info_logs?: Array<{ name?: string; owner?: string; creation?: string; content?: string }>;
};

async function loadActivity(settings: FrappeSettings, name: string) {
  const query = new URLSearchParams({ doctype: "Enquiry", name });
  const response = await requestFrappe<{ docinfo?: DocInfo }>(
    `/api/method/frappe.desk.form.load.get_docinfo?${query}`,
    "GET",
    settings
  );
  const info = response.docinfo;
  if (!info) return [];
  const actor = (owner?: string) => info.user_info?.[owner || ""]?.fullname || owner || "Frappe";
  const entries = (info.versions ?? []).flatMap((version) => {
    let changes: Array<[string, unknown, unknown]> = [];
    try {
      changes = (JSON.parse(version.data || "{}") as { changed?: typeof changes }).changed ?? [];
    } catch {
      return [];
    }
    return changes.map(([field, before, after], index) => ({
      name: `${version.name || "version"}-${index}`,
      action: "changed",
      details: `${field.replaceAll("_", " ")} from ${String(before ?? "—")} to ${String(after ?? "—")}`,
      createdBy: actor(version.owner),
      createdAt: version.creation || ""
    }));
  });
  for (const log of info.info_logs ?? [])
    entries.push({
      name: log.name || `log-${entries.length}`,
      action: "edited",
      details: (log.content || "").replace(/<[^>]*>/g, " ").trim(),
      createdBy: actor(log.owner),
      createdAt: log.creation || ""
    });
  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mapLiveEnquiry(
  item: RemoteEnquiry,
  employeeNames: Map<string, string>,
  comments: Awaited<ReturnType<typeof listEnquiryJobComments>>
) {
  return {
    name: item.name,
    title: item.title || item.name,
    details: item.enquiry_details || "",
    customer: item.customer || null,
    mobile: item.mobile || null,
    date: item.date || null,
    dueDate: item.due_date || null,
    group: item.group || null,
    creator: employeeNames.get(item.user_employee || "") || item.user_employee || null,
    assignee:
      employeeNames.get(item.assigned_to_employee || "") || item.assigned_to_employee || null,
    priority: item.priority || null,
    status: item.status || null,
    statusDetails: item.status_details || null,
    createdAt: item.creation || null,
    modifiedAt: item.modified || null,
    creatorCode: item.user_employee || null,
    assigneeCode: item.assigned_to_employee || null,
    messages: comments
      .filter((comment) => comment.job_type === "Enquiry" && comment.job_id === item.name)
      .map((comment) => ({
        name: comment.name,
        body: comment.comment || "",
        parentName: comment.parent_comment || null,
        createdBy: comment.owner || null,
        createdAt: comment.creation || null
      }))
  };
}

async function loadEmployeeNames(settings: FrappeSettings, enquiries: RemoteEnquiry[]) {
  const codes = [
    ...new Set(
      enquiries.flatMap((item) =>
        [item.user_employee, item.assigned_to_employee].filter((code): code is string =>
          Boolean(code)
        )
      )
    )
  ];
  if (!codes.length) return new Map<string, string>();
  const params = new URLSearchParams({
    fields: JSON.stringify(["name", "employee_name", "user_id"]),
    filters: JSON.stringify([["name", "in", codes]]),
    limit_page_length: String(codes.length)
  });
  try {
    const response = await requestFrappe<{ data?: RemoteEmployee[] }>(
      `/api/resource/Employee?${params}`,
      "GET",
      settings
    );
    const names = new Map(
      (response.data ?? [])
        .filter((employee) => codes.includes(employee.name))
        .map((employee) => [
          employee.name,
          employee.employee_name?.trim() || employee.user_id?.trim() || employee.name
        ])
    );
    if (!names.size) console.warn("Frappe employee lookup returned no matching records.");
    return names;
  } catch (error) {
    console.warn("Frappe employee lookup failed:", error instanceof Error ? error.message : error);
    return new Map<string, string>();
  }
}

function searchDate(value: string) {
  const displayDate = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  return displayDate ? `${displayDate[3]}-${displayDate[2]}-${displayDate[1]}` : value.trim();
}

function matchesStatus(status: string, filter: string) {
  const code = status.trim().toLowerCase().replace(/\s+/g, "-");
  if (filter === "all") return true;
  if (code === "none") return filter === "none";
  if (filter === "active") return !["won", "lost", "closed"].includes(code);
  if (filter === "hold")
    return ["hold-for-approval", "long-hold", "hold-for-spares", "hold-for-job-out"].includes(code);
  if (filter === "pending-group")
    return ["open", "reopen", "re-open", "escalation", "pending"].includes(code);
  if (filter === "in-progress")
    return [
      "open",
      "reopen",
      "re-open",
      "escalation",
      "pending",
      "in-progress",
      "hold-for-approval",
      "long-hold",
      "hold-for-spares",
      "hold-for-job-out"
    ].includes(code);
  if (filter === "closed-group") return ["won", "lost", "closed"].includes(code);
  if (filter === "other")
    return ![
      "new",
      "open",
      "reopen",
      "re-open",
      "escalation",
      "pending",
      "in-progress",
      "hold-for-approval",
      "long-hold",
      "hold-for-spares",
      "hold-for-job-out",
      "won",
      "lost",
      "closed"
    ].includes(code);
  return code === filter.trim().toLowerCase().replace(/\s+/g, "-");
}
