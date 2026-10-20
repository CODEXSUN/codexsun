import { sql } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { FrappeConnectionAccess, requestFrappe } from "../connection/index.js";
import type { FrappeSettings } from "../connection/index.js";
import type { FrappeActivityImportContext } from "./activity-import.types.js";

type RemoteActivity = {
  name: string;
  parent?: string | null;
  comment?: string | null;
  mode?: string | null;
  creation?: string | null;
  owner?: string | null;
};
const fields = ["name", "parent", "comment", "mode", "creation", "owner"];
const pageSize = 50;

export class FrappeActivityImportService {
  constructor(
    private readonly context: FrappeActivityImportContext,
    private readonly secret: string,
    private readonly defaults: FrappeSettings
  ) {}

  private get database() {
    return this.context.database;
  }

  async preview(page: number) {
    const settings = await this.settings();
    const remote = await this.list(settings, (page - 1) * pageSize, pageSize + 1);
    const shown = remote.slice(0, pageSize);
    const names = shown.map((item) => item.name);
    const parents = shown
      .map((item) => item.parent)
      .filter((value): value is string => Boolean(value));
    const links = names.length
      ? await this.database
          .selectFrom("frappe_activity_imports")
          .select(["remote_name", "local_activity_id"])
          .where("remote_name", "in", names)
          .execute()
      : [];
    const enquiries = parents.length
      ? await this.database
          .selectFrom("frappe_enquiry_sync")
          .select(["remote_name", "enquiry_id"])
          .where("remote_name", "in", parents)
          .execute()
      : [];
    const localByName = new Map(links.map((link) => [link.remote_name, link.local_activity_id]));
    const enquiryByName = new Map(enquiries.map((link) => [link.remote_name, link.enquiry_id]));
    return {
      page,
      pageSize,
      hasMore: remote.length > pageSize,
      items: shown.map((item) => ({
        name: item.name,
        enquiry: item.parent || null,
        details: plainText(item.comment || ""),
        mode: item.mode || "Comment",
        createdAt: item.creation || null,
        localEnquiryId: enquiryByName.get(item.parent || "") ?? null,
        localActivityId: localByName.get(item.name) ?? null
      }))
    };
  }

  async pull(remoteName: string) {
    const existing = await this.database
      .selectFrom("frappe_activity_imports")
      .select("local_activity_id")
      .where("remote_name", "=", remoteName)
      .executeTakeFirst();
    if (existing)
      return { remoteName, localId: existing.local_activity_id, status: "linked" as const };
    const settings = await this.settings();
    const matches = await this.list(settings, 0, 1, [["name", "=", remoteName]]);
    const activity = matches[0];
    if (!activity || activity.name !== remoteName)
      throw AppError.notFound("Frappe activity was not found.");
    const enquiry = activity.parent
      ? await this.database
          .selectFrom("frappe_enquiry_sync")
          .select("enquiry_id")
          .where("remote_name", "=", activity.parent)
          .executeTakeFirst()
      : null;
    if (!enquiry)
      throw AppError.conflict("Import the activity's enquiry before importing its activity.");
    const details = plainText(activity.comment || "");
    if (!details) throw AppError.validation("Frappe activity has no details to import.");
    const createdAt =
      activity.creation && !Number.isNaN(Date.parse(activity.creation))
        ? new Date(activity.creation).toISOString().slice(0, 19).replace("T", " ")
        : null;
    const actor =
      activity.owner && this.context.resolveActor
        ? await this.context.resolveActor(activity.owner, settings.baseUrl)
        : null;
    const result = await sql`INSERT INTO crm_enquiry_activity
      (enquiry_id, action, details, created_by, created_at)
      VALUES (${enquiry.enquiry_id}, ${String(activity.mode || "Comment").slice(0, 80)}, ${details},
      ${String(actor || activity.owner || "system:frappe-import").slice(0, 191)}, ${createdAt || sql`UTC_TIMESTAMP()`})`.execute(
      this.database
    );
    const localId = Number(result.insertId);
    await sql`INSERT INTO frappe_activity_imports (remote_name, local_activity_id)
      VALUES (${remoteName}, ${localId}) ON DUPLICATE KEY UPDATE local_activity_id=local_activity_id`.execute(
      this.database
    );
    return { remoteName, localId, status: "created" as const };
  }

  private async list(
    settings: FrappeSettings,
    offset: number,
    limit: number,
    extraFilters: unknown[] = []
  ) {
    const response = await requestFrappe<{ data?: RemoteActivity[]; message?: RemoteActivity[] }>(
      "/api/v2/method/frappe.client.get_list",
      "POST",
      settings,
      {
        doctype: "Enquiry Message",
        fields,
        filters: [
          ["parenttype", "=", "Enquiry"],
          ["parentfield", "=", "enquiry_messages"],
          ...extraFilters
        ],
        parent: "Enquiry",
        limit_start: offset,
        limit_page_length: limit,
        order_by: "creation asc"
      }
    );
    const items = response.message ?? response.data;
    if (!Array.isArray(items))
      throw AppError.validation("Frappe returned an invalid activity page.");
    return items;
  }

  private async settings() {
    const settings = await new FrappeConnectionAccess(
      this.database,
      this.secret,
      this.defaults
    ).credentials();
    if (!settings)
      throw AppError.conflict("Verify the Frappe connection before importing activities.");
    return settings;
  }
}

function plainText(value: string) {
  return value
    .replace(/<[^>]*>/gu, " ")
    .replace(/&nbsp;/giu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}
