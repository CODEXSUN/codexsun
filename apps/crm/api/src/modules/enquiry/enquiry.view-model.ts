import type { EnquiryInput, EnquiryRecord } from "./enquiry.types.js";
import type {
  LiveEnquiryInput,
  LiveEnquiryOptions,
  LiveEnquiryRecord,
  LiveEnquiryJob,
  LiveEnquiryEstimate
} from "./enquiry.read-source.js";
import type { LiveScopeSummary } from "./enquiry.read-source.js";

export type EnquiryViewRecord = Omit<
  EnquiryRecord,
  "id" | "enquiryNo" | "listInId" | "statusId" | "priorityId" | "assignedUserId"
> & {
  id: string;
  enquiryNo: string;
  listInId: string | null;
  statusId: string;
  priorityId: string;
  assignedUserId: string | null;
  assignedToName: string | null;
};

export type EnquiryViewInput = Omit<
  EnquiryInput,
  "listInId" | "statusId" | "priorityId" | "assignedUserId"
> & {
  listInId: string | null;
  statusId: string;
  priorityId: string;
  assignedUserId: string | null;
};

const isoDateTime = (date: string | null) => {
  if (!date) return new Date(0).toISOString();
  const frappeDateTime = date.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?$/);
  const parsed = new Date(frappeDateTime ? `${frappeDateTime[1]}T${frappeDateTime[2]}+05:30` : date);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
};

export function indiaDate(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(value));
  const field = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${field("year")}-${field("month")}-${field("day")}`;
}

export const statusCode = (value: string | null) =>
  (value ?? "new").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

function enquiryDisplayNumber(name: string) {
  return /^ENQ-?(\d+)$/i.exec(name)?.[1] ?? name;
}

export function localViewRecord(record: EnquiryRecord): EnquiryViewRecord {
  return {
    ...record,
    id: String(record.id),
    enquiryNo: String(record.enquiryNo),
    listInId: record.listInId === null ? null : String(record.listInId),
    statusId: String(record.statusId),
    priorityId: String(record.priorityId),
    assignedUserId: record.assignedUserId === null ? null : String(record.assignedUserId),
    assignedToName: null
  };
}

export function remoteViewRecord(
  record: LiveEnquiryRecord,
  options?: LiveEnquiryOptions
): EnquiryViewRecord {
  const createdAt = isoDateTime(record.createdAt ?? record.date);
  const status = statusCode(record.status);
  const priority = statusCode(record.priority ?? "Normal");
  const assignee = record.assigneeCode ?? record.assignee;
  return {
    id: record.name,
    enquiryNo: enquiryDisplayNumber(record.name),
    uuid: record.name,
    title: record.title || record.details.slice(0, 100) || "New call",
    description: record.details,
    contactId: null,
    contactName: record.customer,
    capturedName: record.customer ?? record.mobile,
    capturedEmail: null,
    capturedPhone: record.mobile,
    source: "manual",
    sourceReference: null,
    listInId: record.group,
    listIn: record.group,
    statusId: record.status ?? "New",
    status,
    statusName: record.status ?? "New",
    priorityId: record.priority ?? "Normal",
    priority,
    priorityName: record.priority ?? "Normal",
    assignedUserId: assignee,
    assignedToName:
      record.assignee ?? options?.employees.find((item) => item.code === assignee)?.name ?? null,
    enquiredAt: isoDateTime(record.date ?? record.createdAt),
    dueDate: record.dueDate,
    closedReason: record.statusDetails,
    createdBy: record.creator ?? "—",
    createdAt,
    updatedAt: isoDateTime(record.modifiedAt ?? record.createdAt)
  };
}

export function remoteInput(input: EnquiryViewInput, current?: LiveEnquiryRecord): LiveEnquiryInput {
  const mobile = input.capturedPhone?.replace(/\D/g, "") ?? current?.mobile ?? "";
  const details = input.description?.trim() || input.title.trim();
  return {
    title: input.title.trim() || details.slice(0, 100),
    details,
    customer: input.capturedName ?? current?.customer ?? null,
    mobile,
    date: indiaDate(input.enquiredAt),
    dueDate: input.dueDate,
    group: input.listInId,
    assigneeCode: input.assignedUserId,
    priority: input.priorityId,
    status: input.statusId,
    statusDetails: input.closedReason
  };
}

export function remoteViewComments(record: LiveEnquiryRecord) {
  return (record.messages ?? []).map((message) => ({
    id: message.name,
    uuid: message.name,
    enquiryId: record.name,
    parentId: message.parentName,
    body: message.body,
    bodyFormat: "html" as const,
    createdBy: message.createdBy ?? "—",
    createdAt: isoDateTime(message.createdAt)
  }));
}

export function localViewComment<T extends { id: number; enquiryId: number; parentId: number | null }>(
  comment: T
) {
  return {
    ...comment,
    id: String(comment.id),
    enquiryId: String(comment.enquiryId),
    parentId: comment.parentId === null ? null : String(comment.parentId)
  };
}

export function localViewChild<T extends { id: number; enquiryId: number }>(child: T) {
  return { ...child, id: String(child.id), enquiryId: String(child.enquiryId) };
}

const withTime = (date: string | null, time: string | null) =>
  time ? isoDateTime(`${date ?? new Date().toISOString().slice(0, 10)}T${time}+05:30`) : null;

export function remoteViewJob(job: LiveEnquiryJob, enquiry: LiveEnquiryRecord, options: LiveEnquiryOptions) {
  const employee = options.employees.find((item) => item.code === job.employee)?.name ?? job.employee;
  const jobDate = job.createdAt?.slice(0, 10) ?? enquiry.date;
  const startAt = withTime(jobDate, job.startTime) ?? isoDateTime(job.createdAt ?? enquiry.createdAt);
  const stopDate = job.stopTime && job.startTime && job.stopTime < job.startTime && jobDate
    ? new Date(`${jobDate}T00:00:00+05:30`).getTime() + 86_400_000
    : null;
  const stopAt = withTime(stopDate ? indiaDate(new Date(stopDate).toISOString()) : jobDate, job.stopTime);
  return {
    id: job.name,
    uuid: job.name,
    enquiryId: enquiry.name,
    employeeUserId: job.employee,
    employee,
    startAt,
    stopAt,
    durationSeconds: Math.max(0, Math.round(job.hours * 3600)),
    ratePerHour: job.ratePerHour,
    totalCost: job.totalCost,
    status: job.status.toLowerCase() as "running" | "completed" | "cancelled",
    createdBy: enquiry.creator ?? "—",
    createdAt: isoDateTime(job.createdAt ?? enquiry.createdAt),
    updatedAt: isoDateTime(enquiry.modifiedAt ?? enquiry.createdAt)
  };
}

export function remoteViewEstimate(estimate: LiveEnquiryEstimate, enquiry: LiveEnquiryRecord, options: LiveEnquiryOptions) {
  return {
    id: estimate.name,
    uuid: estimate.name,
    enquiryId: enquiry.name,
    date: estimate.date,
    itemName: estimate.itemName,
    supplierContactId: estimate.supplier,
    supplierName: options.suppliers.find((item) => item.code === estimate.supplier)?.name ?? estimate.supplier,
    price: estimate.price,
    createdBy: enquiry.creator ?? "—",
    createdAt: isoDateTime(enquiry.createdAt),
    updatedAt: isoDateTime(enquiry.modifiedAt ?? enquiry.createdAt)
  };
}

export function remoteViewActivity(record: LiveEnquiryRecord) {
  return (record.activity ?? []).map((entry) => ({
    id: entry.name,
    uuid: entry.name,
    enquiryId: record.name,
    action: entry.action,
    details: entry.details,
    createdBy: entry.createdBy,
    createdAt: isoDateTime(entry.createdAt)
  }));
}

export function remoteViewScopeSummary(summary: LiveScopeSummary) {
  const counts = summary.statusCounts.map((item) => ({ ...item, code: statusCode(item.code) }));
  const count = (codes: string[]) => counts.reduce((total, item) => total + (codes.includes(item.code) ? item.count : 0), 0);
  const closed = count(["won", "lost", "closed"]);
  const newCalls = count(["new"]);
  return {
    total: summary.total,
    active: Math.max(0, summary.total - closed),
    newCalls,
    attention: newCalls,
    updated7: summary.updated7 ?? 0,
    updated30: summary.updated30 ?? 0,
    created7: summary.created7 ?? 0,
    created30: summary.created30 ?? 0,
    oldestActiveDays: summary.oldestActiveDays ?? null,
    statusCounts: counts,
    priorityCounts: summary.priorityCounts.map((item) => ({ ...item, code: statusCode(item.code) }))
  };
}
