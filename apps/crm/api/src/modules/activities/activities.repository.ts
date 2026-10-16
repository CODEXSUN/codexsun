import type { Kysely } from "kysely";
import type { ActivitiesDatabase, ActivityFilters, ActivityPage } from "./activities.types.js";

export class ActivitiesRepository {
  constructor(private readonly database: Kysely<ActivitiesDatabase>) {}

  async statuses() {
    return this.database
      .selectFrom("crm_enquiry_statuses")
      .select(["name", "code"])
      .orderBy("sort_order", "asc")
      .execute();
  }

  async list(filters: ActivityFilters): Promise<ActivityPage> {
    const query = this.filteredQuery(filters);
    const [rows, count] = await Promise.all([
      query
        .select([
          "activity.id",
          "activity.action",
          "activity.details",
          "activity.created_by as actorEmail",
          "activity.created_at as createdAt",
          "enquiry.id as enquiryId",
          "enquiry.enquiry_no as enquiryNo",
          "enquiry.captured_name as capturedName",
          "enquiry.captured_phone as capturedPhone",
          "contact.name as contactName",
          "list.name as listIn",
          "assignee.name as allocatedTo",
          "actor_user.name as actorName",
          "status.name as status",
          "status.code as statusCode"
        ])
        .orderBy("activity.created_at", "desc")
        .orderBy("activity.id", "desc")
        .limit(filters.pageSize)
        .offset((filters.page - 1) * filters.pageSize)
        .execute(),
      query
        .select(({ fn }) => fn.count<number>("activity.id").as("total"))
        .executeTakeFirstOrThrow()
    ]);
    return {
      total: Number(count.total),
      items: rows.map((row) => ({
        id: row.id,
        enquiryId: row.enquiryId,
        enquiryNo: row.enquiryNo,
        contact: row.contactName ?? row.capturedName ?? row.capturedPhone ?? "—",
        action: row.action,
        details: row.details,
        actor: row.actorName ?? row.actorEmail,
        allocatedTo: row.allocatedTo,
        listIn: row.listIn,
        status: row.status,
        statusCode: row.statusCode,
        createdAt: toIso(row.createdAt)
      }))
    };
  }

  private filteredQuery(filters: ActivityFilters) {
    let query = this.database
      .selectFrom("crm_enquiry_activity as activity")
      .innerJoin("crm_enquiries as enquiry", "enquiry.id", "activity.enquiry_id")
      .innerJoin("crm_enquiry_statuses as status", "status.id", "enquiry.status_id")
      .leftJoin("core_contacts as contact", "contact.id", "enquiry.contact_id")
      .leftJoin("crm_enquiry_lists as list", "list.id", "enquiry.list_in_id")
      .leftJoin("app_users as assignee", "assignee.id", "enquiry.assigned_user_id")
      .leftJoin("app_users as actor_user", "actor_user.email", "activity.created_by")
      .where("activity.status", "=", "active");
    if (!filters.canViewAll)
      query = query.where((eb) =>
        eb.or([
          eb("enquiry.assigned_user_id", "=", filters.actorUserId ?? -1),
          eb("enquiry.created_by", "=", filters.actorEmail)
        ])
      );
    const like = (value: string) => `%${value.replace(/[\\%_]/gu, "\\$&")}%`;
    if (filters.search) {
      const term = like(filters.search);
      const number = Number(filters.search.replace(/^#/u, ""));
      query = query.where((eb) =>
        eb.or([
          eb("activity.details", "like", term),
          eb("activity.action", "like", term),
          eb("contact.name", "like", term),
          eb("enquiry.captured_name", "like", term),
          eb("enquiry.captured_phone", "like", term),
          eb("assignee.name", "like", term),
          eb("list.name", "like", term),
          eb("status.name", "like", term),
          eb("actor_user.name", "like", term),
          eb("activity.created_by", "like", term),
          eb("enquiry.enquiry_no", "=", Number.isSafeInteger(number) ? number : -1)
        ])
      );
    }
    if (filters.contact) {
      const term = like(filters.contact);
      query = query.where((eb) =>
        eb.or([
          eb("contact.name", "like", term),
          eb("enquiry.captured_name", "like", term),
          eb("enquiry.captured_phone", "like", term)
        ])
      );
    }
    if (filters.enquiry) {
      const number = Number(filters.enquiry.replace(/^#/u, ""));
      query = query.where("enquiry.enquiry_no", "=", Number.isSafeInteger(number) ? number : -1);
    }
    if (filters.allocatedTo)
      query = query.where("assignee.name", "like", like(filters.allocatedTo));
    if (filters.listIn) query = query.where("list.name", "like", like(filters.listIn));
    if (filters.status) query = query.where("status.code", "=", filters.status);
    if (filters.action) query = query.where("activity.action", "like", like(filters.action));
    if (filters.actor)
      query = query.where((eb) =>
        eb.or([
          eb("actor_user.name", "like", like(filters.actor)),
          eb("activity.created_by", "like", like(filters.actor))
        ])
      );
    return query;
  }
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const text = String(value).replace(" ", "T");
  return new Date(text.endsWith("Z") ? text : `${text}Z`).toISOString();
}
