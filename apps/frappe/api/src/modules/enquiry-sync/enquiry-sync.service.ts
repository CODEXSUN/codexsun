import { AppError } from "@codexsun/framework/errors";
import {
  FrappeConnectionRepository,
  requestFrappe,
  type FrappeSettings
} from "../connection/index.js";
import type { EnquiryInput } from "@codexsun/crm-api/enquiry-sync";
import type { EnquirySyncContext, ImportProgress, RemoteEnquiry } from "./enquiry-sync.types.js";

const pageSize = 50;
const previewFields = ["name", "title", "mobile", "date", "priority", "status", "modified"];
const detailFields = [
  ...previewFields,
  "enquiry_details",
  "customer",
  "due_date",
  "status_details",
  "user_employee",
  "assigned_to_employee",
  "group"
];

export class FrappeEnquirySyncService {
  private readonly repository: FrappeConnectionRepository;

  constructor(
    private readonly context: EnquirySyncContext,
    private readonly defaults: FrappeSettings,
    private readonly encryptionSecret: string
  ) {
    this.repository = new FrappeConnectionRepository(context.database);
  }

  async preview(page: number, pageSize = 50) {
    const settings = await this.settings();
    const [enquiries, count] = await Promise.all([
      this.listRemote(settings, (page - 1) * pageSize, pageSize),
      requestFrappe<{ message?: number }>(
        "/api/method/frappe.client.get_count?doctype=Enquiry",
        "GET",
        settings
      )
    ]);
    const total = count.message;
    if (typeof total !== "number" || !Number.isSafeInteger(total) || total < 0)
      throw AppError.validation("Frappe returned an invalid enquiry count.");
    const valid = enquiries
      .filter((item) => typeof item.name === "string" && item.name.trim());
    const links = await this.repository.linksByRemoteNames(valid.map((item) => item.name));
    const items = valid.map((item) => ({
      name: item.name,
      title: item.title?.trim() || item.name,
      mobile: item.mobile?.trim() || null,
      date: item.date || null,
      status: item.status?.trim() || null,
      priority: item.priority?.trim() || null,
      modifiedAt: item.modified || null,
      localEnquiryId: links.get(item.name) ?? null
    }));
    return { hasMore: page * pageSize < total, items, page, pageSize, total };
  }

  async connectionOrigin() {
    const settings = await this.settings();
    if (!settings.enabled || !settings.baseUrl || !settings.apiKey || !settings.apiSecret)
      throw AppError.conflict("Configure and enable the Frappe connection before importing.");
    return settings.baseUrl;
  }

  async importUnlinked(
    report: (progress: ImportProgress) => Promise<void>,
    expectedBaseUrl?: string
  ) {
    const settings = await this.settings();
    if (expectedBaseUrl && settings.baseUrl !== expectedBaseUrl)
      throw AppError.conflict("The Frappe connection changed before this import started.");
    const progress: ImportProgress = {
      scanned: 0,
      created: 0,
      skipped: 0,
      failed: 0,
      failures: []
    };
    for (let start = 0; ; start += pageSize) {
      if ((await this.settings()).baseUrl !== settings.baseUrl)
        throw AppError.conflict("The Frappe connection changed during this import.");
      const page = await this.listRemote(settings, start, pageSize);
      if (!page.length) break;
      const names = page
        .map((item) => item.name)
        .filter((name): name is string => Boolean(name?.trim()));
      const links = await this.repository.linksByRemoteNames(names);
      for (const name of names) {
        progress.scanned += 1;
        if (links.has(name)) {
          progress.skipped += 1;
          continue;
        }
        try {
          const result = await this.pullWithSettings(name, settings);
          if (result.status === "linked") progress.skipped += 1;
          else progress.created += 1;
        } catch (error) {
          progress.failed += 1;
          if (progress.failures.length < 100)
            progress.failures.push({
              name,
              message: error instanceof Error ? error.message : "Import failed."
            });
        }
      }
      await report(progress);
      if (page.length < pageSize) break;
    }
    return progress;
  }

  private async listRemote(
    settings: FrappeSettings,
    start: number,
    size: number
  ) {
    const query = new URLSearchParams({
      fields: JSON.stringify(previewFields),
      limit_start: String(start),
      limit_page_length: String(size),
      order_by: "creation asc"
    });
    const response = await requestFrappe<{ data?: RemoteEnquiry[] }>(
      `/api/resource/Enquiry?${query}`,
      "GET",
      settings
    );
    if (!Array.isArray(response.data))
      throw AppError.validation("Frappe returned an invalid enquiry list.");
    return response.data;
  }

  async pull(remoteName: string) {
    const settings = await this.settings();
    return this.pullWithSettings(remoteName, settings);
  }

  private async pullWithSettings(remoteName: string, settings: FrappeSettings) {
    const response = await requestFrappe<{ data?: RemoteEnquiry }>(
      `/api/resource/Enquiry/${encodeURIComponent(remoteName)}?fields=${encodeURIComponent(JSON.stringify(detailFields))}`,
      "GET",
      settings
    );
    const remote = response.data;
    if (!remote || remote.name !== remoteName)
      throw AppError.validation("The selected Frappe enquiry could not be found.");
    const linked = await this.repository.byRemoteName(remoteName);
    if (!linked) {
      const existing = await this.context.database
        .selectFrom("crm_enquiries")
        .select("id")
        .where("source", "=", "frappe")
        .where("source_reference", "=", remoteName)
        .executeTakeFirst();
      if (existing) {
        await this.repository.save(existing.id, remoteName);
        return { remoteName, enquiryId: existing.id, status: "linked" as const };
      }
    }
    if (linked && linked.source !== "frappe")
      throw AppError.conflict("This enquiry originated locally. Post its changes to Frappe.");
    if (linked && utcMillis(linked.updatedAt) > utcMillis(linked.syncedAt))
      throw AppError.conflict(
        "The local enquiry changed after its last sync. Review it before pulling."
      );

    const input = await this.toLocalInput(remote, linked, settings.baseUrl);
    const local = linked
      ? await this.context.updateEnquiry(linked.enquiryId, input)
      : await this.context.createEnquiry(input);
    await this.repository.save(local.id, remote.name);
    return {
      remoteName: remote.name,
      enquiryId: local.id,
      status: linked ? ("updated" as const) : ("created" as const)
    };
  }

  private async toLocalInput(
    remote: RemoteEnquiry,
    linked: Awaited<ReturnType<FrappeConnectionRepository["byRemoteName"]>>,
    baseUrl: string
  ): Promise<EnquiryInput> {
    const phone = normalizeMobile(remote.mobile, remote.name);
    const customer = remote.customer?.trim() || null;
    if (!phone && !customer)
      throw AppError.validation("The Frappe enquiry needs a mobile or customer before import.");
    const date = remote.date?.trim();
    if (!date || !/^\d{4}-\d{2}-\d{2}$/u.test(date) || Number.isNaN(Date.parse(date)))
      throw AppError.validation("The Frappe enquiry has an invalid date.");
    const statusName = localStatusName(remote.status);
    const priorityName = localPriorityName(remote.priority);
    const status = await this.context.database
      .selectFrom("crm_enquiry_statuses")
      .select(["id", "code"])
      .where("name", "=", statusName)
      .where("status", "=", "active")
      .executeTakeFirst();
    const priority = await this.context.database
      .selectFrom("crm_enquiry_priorities")
      .select("id")
      .where("name", "=", priorityName)
      .where("status", "=", "active")
      .executeTakeFirst();
    if (!status)
      throw AppError.validation(`CRM has no active enquiry status matching ${statusName}.`);
    if (!priority)
      throw AppError.validation(`CRM has no active enquiry priority matching ${priorityName}.`);
    const dueDate = remote.due_date?.trim() || null;
    if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/u.test(dueDate) || Number.isNaN(Date.parse(dueDate))))
      throw AppError.validation("The Frappe enquiry has an invalid due date.");
    const mappedAssignee = remote.assigned_to_employee?.trim()
      ? await this.context.localUserForEmployee(remote.assigned_to_employee.trim(), baseUrl)
      : null;
    const listInId = remote.group?.trim()
      ? await this.context.listInForName(remote.group.trim())
      : (linked?.listInId ?? null);
    return {
      title: (remote.title?.trim() || remote.enquiry_details?.trim() || remote.name).slice(0, 255),
      description: remote.enquiry_details?.trim() || null,
      contactId: linked?.contactId ?? null,
      capturedName: customer,
      capturedEmail: null,
      capturedPhone: phone,
      source: "frappe",
      sourceReference: remote.name,
      listInId,
      statusId: status.id,
      priorityId: priority.id,
      assignedUserId: mappedAssignee ?? linked?.assignedUserId ?? null,
      enquiredAt: `${date}T00:00:00.000Z`,
      dueDate,
      closedReason: ["won", "lost", "closed"].includes(status.code)
        ? remote.status_details?.trim() || "Closed in Frappe"
        : null
    };
  }

  private async settings() {
    return (await this.repository.credentials(this.encryptionSecret))?.settings ?? this.defaults;
  }
}

function utcMillis(value: string | Date) {
  if (value instanceof Date) return value.getTime();
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const timestamp = new Date(normalized).getTime();
  if (Number.isNaN(timestamp))
    throw AppError.conflict(
      "The stored enquiry sync time is invalid. Review this link before pulling."
    );
  return timestamp;
}

function localStatusName(value: string | null | undefined) {
  const name = value?.trim() || "New";
  const aliases: Record<string, string> = { pending: "Open", hold: "Long Hold" };
  return aliases[name.toLowerCase()] ?? name;
}

function localPriorityName(value: string | null | undefined) {
  const name = value?.trim() || "Normal";
  return name.toLowerCase() === "medium" ? "Normal" : name;
}

function normalizeMobile(value: string | null | undefined, remoteName: string) {
  const raw = value?.trim();
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/gu, "");
  if (/^\d{10}$/u.test(digits)) return digits;
  if (/^91\d{10}$/u.test(digits)) return digits.slice(2);
  if (/^0\d{10}$/u.test(digits)) return digits.slice(1);
  throw AppError.validation(
    `Frappe enquiry ${remoteName} needs a 10-digit mobile number for local CRM.`
  );
}
