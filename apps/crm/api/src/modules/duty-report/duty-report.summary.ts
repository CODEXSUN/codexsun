import { sql, type Kysely } from "kysely";
import type { DutyReportDatabase } from "./duty-report.types.js";
export type DutyReportView = "sop" | "user" | "department" | "frequency";
export class DutyReportSummaryRepository {
  constructor(private readonly db: Kysely<DutyReportDatabase>) {}
  async list(
    view: DutyReportView,
    filters: { search?: string | undefined; from?: string | undefined; to?: string | undefined }
  ) {
    const columns = {
      sop: ["item.id", "item.title"],
      user: ["person.id", "person.name"],
      department: ["item.department", "item.department"],
      frequency: ["item.frequency", "item.frequency"]
    } as const;
    const [key, label] = columns[view];
    let query = this.db
      .selectFrom("crm_duty_reports as report")
      .innerJoin("crm_duty_assignments as assignment", "assignment.id", "report.assignment_id")
      .innerJoin("crm_sop_items as item", "item.id", "assignment.sop_item_id")
      .innerJoin("crm_sops as sop", "sop.id", "item.sop_id")
      .innerJoin("app_users as person", "person.id", "report.assignee_user_id");
    if (filters.from) query = query.where("report.performed_date", ">=", filters.from);
    if (filters.to) query = query.where("report.performed_date", "<=", filters.to);
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.where((eb) =>
        eb.or([
          eb("sop.title", "like", term),
          eb("item.title", "like", term),
          eb("person.name", "like", term),
          eb("report.actions", "like", term)
        ])
      );
    }
    const rows = await query
      .select([
        sql<string>`CAST(${sql.ref(key)} AS CHAR)`.as("key"),
        sql<string>`COALESCE(NULLIF(${sql.ref(label)}, ''), '(Not set)')`.as("label"),
        sql<number>`COUNT(*)`.as("total"),
        sql<number>`SUM(CASE WHEN report.result = 'completed' THEN 1 ELSE 0 END)`.as("completed"),
        sql<number>`SUM(CASE WHEN report.result = 'blocked' THEN 1 ELSE 0 END)`.as("blocked")
      ])
      .groupBy([sql.ref(key), sql.ref(label)])
      .orderBy("label")
      .execute();
    return rows.map((row) => ({
      ...row,
      total: Number(row.total),
      completed: Number(row.completed),
      blocked: Number(row.blocked)
    }));
  }
}
