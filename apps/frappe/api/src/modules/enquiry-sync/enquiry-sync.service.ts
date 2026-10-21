import { AppError } from "@codexsun/framework/errors";
import { createHash } from "node:crypto";
import {
  FrappeConnectionRepository,
  requestFrappe,
  type FrappeSettings
} from "../connection/index.js";
import type { EnquiryInput } from "@codexsun/crm-api/enquiry-sync";
import { normalizeFrappeEnquiryTitle } from "../export/enquiry-title.js";
import type { EnquirySyncContext, ImportProgress, RemoteEnquiry } from "./enquiry-sync.types.js";

const pageSize = 50;
const previewFields = [
  "name",
  "title",
  "mobile",
  "date",
  "priority",
  "status",
  "modified",
  "creation",
  "owner"
];
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
  private readonly customerNames = new Map<string, Promise<string | null>>();

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
    const valid = enquiries.filter((item) => typeof item.name === "string" && item.name.trim());
    const links = await this.repository.linksByRemoteNames(valid.map((item) => item.name));
    const items = valid.map((item) => ({
      name: item.name,
      title: normalizeFrappeEnquiryTitle(item.title) || item.name,
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
      for (const name of names) {
        progress.scanned += 1;
        try {
          // A bulk import is explicitly source-directed: Frappe values, including
          // modified timestamps, are authoritative for this reconciliation pass.
          const result = await this.pullWithSettings(name, settings, true);
          if (result.status === "updated") progress.skipped += 1;
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

  async importModifiedSince(
    modifiedAfter: string,
    report: (progress: ImportProgress) => Promise<void>,
    expectedBaseUrl?: string
  ) {
    const settings = await this.settings();
    if (expectedBaseUrl && settings.baseUrl !== expectedBaseUrl)
      throw AppError.conflict("The Frappe connection changed before live import started.");
    const progress: ImportProgress = {
      scanned: 0,
      created: 0,
      skipped: 0,
      failed: 0,
      failures: []
    };
    const processed = new Set<string>();
    for (let start = 0; ; start += pageSize) {
      if ((await this.settings()).baseUrl !== settings.baseUrl)
        throw AppError.conflict("The Frappe connection changed during live import.");
      const page = await this.listRemote(settings, start, pageSize, modifiedAfter);
      for (const remote of page) {
        if (!remote.name?.trim()) continue;
        processed.add(remote.name);
        progress.scanned += 1;
        try {
          const linked = await this.repository.byRemoteName(remote.name);
          const sourceModified = normalizeSourceDateTime(remote.modified, remote.name, "modified");
          if (linked && utcMillis(linked.syncedAt) >= utcMillis(sourceModified)) {
            progress.skipped += 1;
          } else {
            const result = await this.pullWithSettings(remote.name, settings);
            if (result.status === "created") progress.created += 1;
            else progress.skipped += 1;
          }
        } catch (error) {
          progress.failed += 1;
          if (progress.failures.length < 100)
            progress.failures.push({
              name: remote.name,
              message: error instanceof Error ? error.message : "Live import failed."
            });
        }
      }
      await report(progress);
      if (page.length < pageSize) break;
    }
    await this.importChangedCommentParents(settings, modifiedAfter, processed, progress);
    await report(progress);
    return progress;
  }

  private async importChangedCommentParents(
    settings: FrappeSettings,
    modifiedAfter: string,
    processed: Set<string>,
    progress: ImportProgress
  ) {
    const filters = JSON.stringify([
      ["Comment", "reference_doctype", "=", "Enquiry"],
      ["Comment", "modified", ">", frappeLocalDateTime(modifiedAfter)]
    ]);
    const names = new Set<string>();
    for (let start = 0; ; start += 500) {
      const query = new URLSearchParams({
        filters,
        fields: JSON.stringify(["reference_name"]),
        order_by: "modified asc",
        limit_start: String(start),
        limit_page_length: "500"
      });
      const response = await requestFrappe<{
        data?: Array<{ reference_name?: string | null }>;
      }>(`/api/resource/Comment?${query}`, "GET", settings);
      if (!Array.isArray(response.data))
        throw AppError.validation("Frappe returned an invalid live comment list.");
      for (const comment of response.data) {
        if (comment.reference_name && !processed.has(comment.reference_name))
          names.add(comment.reference_name);
      }
      if (response.data.length < 500) break;
    }
    for (const remoteName of names) {
      progress.scanned += 1;
      try {
        const linked = await this.repository.byRemoteName(remoteName);
        if (!linked) {
          await this.pullWithSettings(remoteName, settings);
          progress.created += 1;
          continue;
        }
        const response = await requestFrappe<{ data?: RemoteEnquiry }>(
          `/api/resource/Enquiry/${encodeURIComponent(remoteName)}?fields=${encodeURIComponent(JSON.stringify(detailFields))}`,
          "GET",
          settings
        );
        if (!response.data || response.data.name !== remoteName)
          throw AppError.validation(`Frappe enquiry ${remoteName} could not be read.`);
        await this.importEnquiryMessages(
          linked.enquiryId,
          response.data.enquiry_messages ?? [],
          settings
        );
        await this.importComments(linked.enquiryId, remoteName, settings);
        progress.skipped += 1;
      } catch (error) {
        progress.failed += 1;
        if (progress.failures.length < 100)
          progress.failures.push({
            name: remoteName,
            message: error instanceof Error ? error.message : "Live comment import failed."
          });
      }
    }
  }

  private async listRemote(
    settings: FrappeSettings,
    start: number,
    size: number,
    modifiedAfter?: string
  ) {
    const query = new URLSearchParams({
      fields: JSON.stringify(previewFields),
      limit_start: String(start),
      limit_page_length: String(size),
      order_by: "creation asc"
    });
    if (modifiedAfter) {
      query.set(
        "filters",
        JSON.stringify([["Enquiry", "modified", ">", frappeLocalDateTime(modifiedAfter)]])
      );
    }
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

  private async pullWithSettings(
    remoteName: string,
    settings: FrappeSettings,
    allowSourceOverwrite = false
  ) {
    const response = await requestFrappe<{ data?: RemoteEnquiry }>(
      `/api/resource/Enquiry/${encodeURIComponent(remoteName)}?fields=${encodeURIComponent(JSON.stringify(detailFields))}`,
      "GET",
      settings
    );
    const remote = response.data;
    if (!remote || remote.name !== remoteName)
      throw AppError.validation("The selected Frappe enquiry could not be found.");
    let linked = await this.repository.byRemoteName(remoteName);
    if (!linked) {
      const existing = await this.context.database
        .selectFrom("crm_enquiries")
        .select([
          "id",
          "source",
          "updated_at as updatedAt",
          "contact_id as contactId",
          "assigned_user_id as assignedUserId",
          "list_in_id as listInId"
        ])
        .where("source", "=", "frappe")
        .where("source_reference", "=", remoteName)
        .executeTakeFirst();
      if (existing) {
        await this.repository.save(existing.id, remoteName);
        linked = {
          enquiryId: existing.id,
          source: existing.source,
          updatedAt: existing.updatedAt,
          contactId: existing.contactId,
          assignedUserId: existing.assignedUserId,
          listInId: existing.listInId,
          syncedAt: new Date().toISOString()
        };
      }
    }
    if (linked && linked.source !== "frappe")
      throw AppError.conflict("This enquiry originated locally. Post its changes to Frappe.");
    if (linked && !allowSourceOverwrite && utcMillis(linked.updatedAt) > utcMillis(linked.syncedAt))
      throw AppError.conflict(
        "The local enquiry changed after its last sync. Review it before pulling."
      );

    const input = await this.toLocalInput(remote, linked, settings);
    const source = await this.sourceMetadata(remote, settings);
    const local = linked
      ? this.context.updateImportedEnquiry
        ? await this.context.updateImportedEnquiry(linked.enquiryId, input, source)
        : await this.context.updateEnquiry(linked.enquiryId, input)
      : await this.createFromFrappe(remote, input, settings);
    await this.repository.save(local.id, remote.name);
    if (source.externalCustomer && local.contactId && this.context.linkCustomerIdentity)
      await this.context.linkCustomerIdentity(
        source.externalCustomer.externalKey,
        source.externalCustomer.code,
        local.contactId
      );
    await this.importEnquiryMessages(local.id, remote.enquiry_messages ?? [], settings);
    await this.importComments(local.id, remote.name, settings);
    return {
      remoteName: remote.name,
      enquiryId: local.id,
      status: linked ? ("updated" as const) : ("created" as const)
    };
  }

  private async createFromFrappe(
    remote: RemoteEnquiry,
    input: EnquiryInput,
    settings: FrappeSettings
  ) {
    const source = await this.sourceMetadata(remote, settings);
    if (this.context.createImportedEnquiry)
      return this.context.createImportedEnquiry(input, source);
    return this.context.createEnquiry(input);
  }

  private async sourceMetadata(remote: RemoteEnquiry, settings: FrappeSettings) {
    const match = /^ENQ([1-9]\d*)$/u.exec(remote.name);
    const enquiryNo = match ? Number(match[1]) : NaN;
    if (!Number.isSafeInteger(enquiryNo))
      throw AppError.validation(
        `Frappe enquiry ${remote.name} does not have a compatible CRM serial.`
      );
    const createdAt = normalizeSourceDateTime(remote.creation, remote.name, "creation");
    const updatedAt = normalizeSourceDateTime(remote.modified, remote.name, "modified");
    const employeeActor = remote.user_employee?.trim()
      ? await this.context.localActorForEmployee?.(remote.user_employee.trim(), settings.baseUrl)
      : null;
    const ownerActor = remote.owner?.trim()
      ? await this.context.localActorForFrappeUser?.(remote.owner.trim(), settings.baseUrl)
      : null;
    const createdBy = employeeActor ?? ownerActor ?? remote.owner?.trim() ?? "frappe-import";
    const customerId = remote.customer?.trim();
    const customerName = customerId ? await this.customerName(customerId, settings) : null;
    const mobile = normalizeMobile(remote.mobile, remote.name);
    const externalCustomer =
      customerId && customerName && mobile
        ? {
            externalKey: createHash("sha256")
              .update(
                JSON.stringify([
                  new URL(settings.baseUrl).origin.toLowerCase(),
                  "Mobile Contact Customer",
                  "customer",
                  customerId
                ])
              )
              .digest("hex"),
            code: customerId,
            name: customerName,
            mobile
          }
        : undefined;
    return {
      enquiryNo,
      createdAt,
      updatedAt,
      createdBy,
      ...(externalCustomer ? { externalCustomer } : {})
    };
  }

  private async importComments(enquiryId: number, remoteName: string, settings: FrappeSettings) {
    if (!this.context.importComment) return;
    const filters = JSON.stringify([
      ["Comment", "reference_doctype", "=", "Enquiry"],
      ["Comment", "reference_name", "=", remoteName]
    ]);
    const fields = JSON.stringify(["name", "content", "owner", "creation", "comment_type"]);
    for (let start = 0; ; start += 500) {
      const path = `/api/resource/Comment?${new URLSearchParams({ filters, fields, order_by: "creation asc", limit_start: String(start), limit_page_length: "500" })}`;
      const response = await requestFrappe<{
        data?: Array<{
          name: string;
          content?: string | null;
          owner?: string | null;
          creation?: string | null;
          comment_type?: string | null;
        }>;
      }>(path, "GET", settings);
      if (!Array.isArray(response.data))
        throw AppError.validation("Frappe returned an invalid enquiry comment list.");
      for (const comment of response.data) {
        if (
          !comment.name ||
          !comment.content?.trim() ||
          !["Comment", "Info"].includes(comment.comment_type ?? "Comment")
        )
          continue;
        const author = comment.owner?.trim()
          ? ((await this.context.localActorForFrappeUser?.(
              comment.owner.trim(),
              settings.baseUrl
            )) ?? comment.owner.trim())
          : "frappe-import";
        await this.context.importComment(enquiryId, {
          id: comment.name,
          content: comment.content,
          author,
          createdAt: normalizeSourceDateTime(comment.creation, comment.name, "comment creation")
        });
      }
      if (response.data.length < 500) break;
    }
  }

  private async importEnquiryMessages(
    enquiryId: number,
    messages: NonNullable<RemoteEnquiry["enquiry_messages"]>,
    settings: FrappeSettings
  ) {
    if (!this.context.importComment) return;
    for (const message of messages) {
      if (!message.name || !message.comment?.trim()) continue;
      const author = message.owner?.trim()
        ? ((await this.context.localActorForFrappeUser?.(message.owner.trim(), settings.baseUrl)) ??
          message.owner.trim())
        : "frappe-import";
      await this.context.importComment(enquiryId, {
        id: message.name,
        content: message.comment,
        author,
        createdAt: normalizeSourceDateTime(message.creation, message.name, "message creation")
      });
    }
  }

  private async toLocalInput(
    remote: RemoteEnquiry,
    linked: Awaited<ReturnType<FrappeConnectionRepository["byRemoteName"]>>,
    settings: FrappeSettings
  ): Promise<EnquiryInput> {
    const phone = normalizeMobile(remote.mobile, remote.name);
    const customerId = remote.customer?.trim() || null;
    const customer = customerId
      ? ((await this.customerName(customerId, settings)) ?? customerId)
      : null;
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
      ? await this.context.localUserForEmployee(
          remote.assigned_to_employee.trim(),
          settings.baseUrl
        )
      : null;
    const listInId = remote.group?.trim()
      ? await this.context.listInForName(remote.group.trim())
      : (linked?.listInId ?? null);
    return {
      title:
        normalizeFrappeEnquiryTitle(remote.title) ||
        normalizeFrappeEnquiryTitle(remote.enquiry_details) ||
        remote.name,
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
      // The source field is authoritative; retaining a previous assignee after an unassignment
      // would make the local enquiry appear allocated to the wrong user.
      assignedUserId: mappedAssignee,
      enquiredAt: `${date}T00:00:00.000Z`,
      dueDate,
      closedReason: ["won", "lost", "closed"].includes(status.code)
        ? remote.status_details?.trim() || "Closed in Frappe"
        : null
    };
  }

  private customerName(customerId: string, settings: FrappeSettings) {
    const existing = this.customerNames.get(customerId);
    if (existing) return existing;
    const pending = requestFrappe<{ data?: { customer_name?: string | null } }>(
      `/api/resource/Customer/${encodeURIComponent(customerId)}?fields=${encodeURIComponent(JSON.stringify(["customer_name"]))}`,
      "GET",
      settings
    ).then((response) => response.data?.customer_name?.trim() || null);
    this.customerNames.set(customerId, pending);
    return pending;
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

function frappeLocalDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(value));
  const field = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${field("year")}-${field("month")}-${field("day")} ${field("hour")}:${field("minute")}:${field("second")}`;
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

function normalizeSourceDateTime(
  value: string | null | undefined,
  remoteName: string,
  field: string
) {
  const normalized = value?.trim().replace(" ", "T");
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/iu.test(normalized ?? "");
  const sourceDateTime = normalized && !hasTimezone ? `${normalized}+05:30` : normalized;
  if (!sourceDateTime || Number.isNaN(Date.parse(sourceDateTime)))
    throw AppError.validation(`Frappe enquiry ${remoteName} has an invalid ${field} timestamp.`);
  return new Date(sourceDateTime).toISOString();
}
