import type { DutyReportContext } from "./duty-report.types.js";
import type { SopFrequency } from "../sop-item/index.js";
import { AppError } from "@codexsun/framework/errors";
import { randomUUID } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { DutyReport, DutyReportDatabase, DutyReportInput } from "./duty-report.types.js";
import { enqueueCrmFrappeSync } from "../frappe-sync/index.js";
import type { CrmFrappeSyncDatabase } from "../frappe-sync/index.js";
export class DutyReportRepository {
  constructor(
    private readonly db: Kysely<DutyReportDatabase>,
    private readonly notifyWork?: DutyReportContext["notifyWork"]
  ) {}
  query() {
    return this.db
      .selectFrom("crm_duty_reports as report")
      .innerJoin("crm_duty_assignments as assignment", "assignment.id", "report.assignment_id")
      .innerJoin("crm_sop_items as item", "item.id", "assignment.sop_item_id")
      .innerJoin("crm_sops as sop", "sop.id", "item.sop_id")
      .innerJoin("crm_sop_item_revisions as revision", "revision.id", "report.revision_id")
      .innerJoin("app_users as person", "person.id", "report.assignee_user_id")
      .leftJoin("crm_frappe_sync_queue as sync", (join) =>
        join
          .onRef("sync.local_record_id", "=", "report.id")
          .on("sync.entity_type", "=", "duty-report")
      )
      .select([
        "report.id",
        "report.uuid",
        "report.assignment_id",
        "report.revision_id",
        "report.assignee_user_id",
        "report.performed_date",
        "report.recurrence_key",
        "report.actions",
        "report.result",
        "report.issue_details",
        "report.submitted_by",
        "report.created_at",
        "item.title as item_title",
        "sop.title as sop_title",
        "item.frequency",
        "item.department",
        "revision.instructions",
        "person.name as assignee_name",
        "sync.status as frappe_sync_status"
      ]);
  }
  async list(
    filters: {
      userId?: number;
      search?: string;
      from?: string;
      to?: string;
      assigneeId?: number;
      sopItemId?: number;
      department?: string;
      frequency?: SopFrequency;
      result?: "completed" | "blocked";
      page?: number;
      pageSize?: number;
    } = {}
  ) {
    const applyFilters = (query: ReturnType<DutyReportRepository["query"]>) => {
      if (filters.userId !== undefined)
        query = query.where("report.assignee_user_id", "=", filters.userId);
      if (filters.assigneeId !== undefined)
        query = query.where("report.assignee_user_id", "=", filters.assigneeId);
      if (filters.sopItemId !== undefined) query = query.where("item.id", "=", filters.sopItemId);
      if (filters.department !== undefined)
        query = query.where("item.department", "=", filters.department);
      if (filters.frequency !== undefined)
        query = query.where("item.frequency", "=", filters.frequency);
      if (filters.from) query = query.where("report.performed_date", ">=", filters.from);
      if (filters.to) query = query.where("report.performed_date", "<=", filters.to);
      if (filters.result) query = query.where("report.result", "=", filters.result);
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
      return query;
    };
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 100;
    const [rows, total, summary] = await Promise.all([
      applyFilters(this.query())
        .orderBy("report.performed_date", "desc")
        .orderBy("report.id", "desc")
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute(),
      applyFilters(this.query())
        .clearSelect()
        .select(({ fn }) => fn.countAll<number>().as("total"))
        .executeTakeFirst(),
      applyFilters(this.query())
        .clearSelect()
        .select(({ fn, ref }) => [
          fn.countAll<number>().as("total"),
          fn
            .sum<number>(
              sql<number>`CASE WHEN ${ref("report.result")} = 'completed' THEN 1 ELSE 0 END`
            )
            .as("completed"),
          fn
            .sum<number>(
              sql<number>`CASE WHEN ${ref("report.result")} = 'blocked' THEN 1 ELSE 0 END`
            )
            .as("blocked")
        ])
        .executeTakeFirst()
    ]);
    return {
      items: rows.map(map),
      total: Number(total?.total ?? 0),
      page,
      pageSize,
      summary: {
        total: Number(summary?.total ?? 0),
        completed: Number(summary?.completed ?? 0),
        blocked: Number(summary?.blocked ?? 0)
      }
    };
  }
  async update(
    id: number,
    input: Pick<DutyReportInput, "performedDate" | "actions">,
    userId: number,
    actor: string,
    key: string
  ) {
    try {
      await this.db.transaction().execute(async (trx) => {
        const report = await trx
          .selectFrom("crm_duty_reports")
          .selectAll()
          .where("id", "=", id)
          .forUpdate()
          .executeTakeFirst();
        if (!report) throw AppError.notFound("Duty report was not found.");
        if (Number(report.assignee_user_id) !== userId)
          throw AppError.forbidden("Only your own duty reports can be edited.");
        const assignment = await trx
          .selectFrom("crm_duty_assignments")
          .select(["start_date", "end_date"])
          .where("id", "=", report.assignment_id)
          .executeTakeFirstOrThrow();
        if (
          dateOnly(assignment.start_date) > input.performedDate ||
          (assignment.end_date && dateOnly(assignment.end_date) < input.performedDate)
        )
          throw AppError.validation("Report date must be within the duty assignment dates.");
        await trx
          .insertInto("crm_duty_report_edits")
          .values({ report_id: id, before_data: JSON.stringify(report), changed_by: actor })
          .execute();
        await trx
          .updateTable("crm_duty_reports")
          .set({ performed_date: input.performedDate, recurrence_key: key, actions: input.actions })
          .where("id", "=", id)
          .execute();
        await enqueueCrmFrappeSync(
          trx as unknown as Kysely<CrmFrappeSyncDatabase>,
          "duty-report",
          id,
          actor
        );
        await this.notifyWork?.(
          trx,
          report.assignment_id,
          `Report edited (${input.performedDate}): ${input.actions}`
        );
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ER_DUP_ENTRY"
      )
        throw AppError.conflict("A report already exists for this duty period.");
      throw error;
    }
    return (await this.query().where("report.id", "=", id).execute()).map(map)[0]!;
  }
  async get(id: number) {
    const row = await this.query().where("report.id", "=", id).executeTakeFirst();
    return row ? map(row) : null;
  }
  async create(input: DutyReportInput, userId: number, actor: string, recurrenceKey: string) {
    const assignment = await this.db
      .selectFrom("crm_duty_assignments")
      .select(["id", "revision_id", "assignee_user_id", "start_date", "end_date", "status"])
      .where("id", "=", input.assignmentId)
      .executeTakeFirst();
    if (
      !assignment ||
      Number(assignment.assignee_user_id) !== userId ||
      assignment.status !== "active" ||
      dateOnly(assignment.start_date) > input.performedDate ||
      (assignment.end_date && dateOnly(assignment.end_date) < input.performedDate)
    )
      return null;
    const existing = await this.db
      .selectFrom("crm_duty_reports")
      .select("id")
      .where("assignment_id", "=", input.assignmentId)
      .where("recurrence_key", "=", recurrenceKey)
      .executeTakeFirst();
    if (existing)
      return (
        (await this.query().where("report.id", "=", existing.id).execute()).map(map)[0] ?? null
      );
    try {
      const reportId = await this.db.transaction().execute(async (trx) => {
        const inserted = await trx
          .insertInto("crm_duty_reports")
          .values({
            uuid: randomUUID(),
            assignment_id: assignment.id,
            revision_id: assignment.revision_id,
            assignee_user_id: userId,
            performed_date: input.performedDate,
            recurrence_key: recurrenceKey,
            actions: input.actions,
            result: input.result,
            issue_details: input.issueDetails,
            submitted_by: actor
          })
          .executeTakeFirstOrThrow();
        const id = Number(inserted.insertId);
        await enqueueCrmFrappeSync(
          trx as unknown as Kysely<CrmFrappeSyncDatabase>,
          "duty-report",
          id,
          actor
        );
        await this.notifyWork?.(
          trx,
          assignment.id,
          `Report ${input.result} (${input.performedDate}): ${input.actions}${input.issueDetails ? `\nIssue: ${input.issueDetails}` : ""}`
        );
        return id;
      });
      return (await this.query().where("report.id", "=", reportId).execute()).map(map)[0] ?? null;
    } catch (error) {
      if (!(
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ER_DUP_ENTRY"
      ))
        throw error;
      const winner = await this.db
        .selectFrom("crm_duty_reports")
        .select("id")
        .where("assignment_id", "=", input.assignmentId)
        .where("recurrence_key", "=", recurrenceKey)
        .executeTakeFirst();
      return winner
        ? ((await this.query().where("report.id", "=", winner.id).execute()).map(map)[0] ?? null)
        : null;
    }
  }
}
type SelectedReport = Awaited<
  ReturnType<ReturnType<DutyReportRepository["query"]>["execute"]>
>[number];
function map(row: SelectedReport): DutyReport {
  return {
    id: row.id,
    uuid: row.uuid,
    assignmentId: row.assignment_id,
    revisionId: row.revision_id,
    assigneeUserId: row.assignee_user_id,
    performedDate: dateOnly(row.performed_date),
    recurrenceKey: row.recurrence_key,
    actions: row.actions,
    result: row.result,
    frappeSyncStatus: row.frappe_sync_status ?? null,
    issueDetails: row.issue_details,
    submittedBy: row.submitted_by,
    createdAt: new Date(row.created_at).toISOString(),
    itemTitle: row.item_title,
    sopTitle: row.sop_title,
    assigneeName: row.assignee_name,
    department: row.department,
    instructions: row.instructions,
    frequency: row.frequency
  };
}
function dateOnly(value: unknown) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}
