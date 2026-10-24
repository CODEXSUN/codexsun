import { WorkReportHistory } from "./work-report.history.js";
import { randomBytes } from "node:crypto";
import { sql, type Kysely, type Transaction } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type {
  WorkReportDatabase,
  WorkReportInput,
  WorkReportHistoryFilter,
  WorkReportTarget,
  WorkReportContext
} from "./work-report.types.js";
export class WorkReportRepository {
  constructor(private readonly db: Kysely<WorkReportDatabase>) {}
  async pendingEnquiryCollectionIds(actorUserId: number | null, actorEmail: string) {
    const result = await sql<{ enquiryId: number }>`
      SELECT report.enquiry_id AS enquiryId
      FROM crm_work_reports AS report
      INNER JOIN crm_enquiries AS enquiry ON enquiry.id=report.enquiry_id
      WHERE report.status='active' AND report.action IN ('charge','collection')
        AND (enquiry.assigned_user_id=${actorUserId}
          OR LOWER(enquiry.created_by)=LOWER(${actorEmail}))
      GROUP BY report.enquiry_id
      HAVING COALESCE(SUM(CASE WHEN report.action='charge' THEN report.amount
        ELSE -report.amount END),0)>0
    `.execute(this.db);
    return result.rows.map(({ enquiryId }) => Number(enquiryId));
  }
  async target(target: WorkReportTarget, db: Kysely<WorkReportDatabase> = this.db, lock = false) {
    let query =
      target.enquiryId !== null
        ? db
            .selectFrom("crm_enquiries")
            .select(["id", "title", "assigned_user_id", "created_by", "status_id"])
            .where("id", "=", target.enquiryId)
        : db
            .selectFrom("crm_tasks")
            .select(["id", "title", "assigned_user_id", "created_by", "status_id"])
            .where("id", "=", target.taskId!);
    if (lock) query = query.forUpdate();
    const row = await query.executeTakeFirst();
    if (!row) throw AppError.notFound("Assigned work was not found.");
    return row;
  }
  async checkpoint(target: WorkReportTarget, actor: string) {
    const last = await this.db
      .selectFrom("crm_work_reports")
      .select("action")
      .where(
        target.enquiryId !== null ? "enquiry_id" : "task_id",
        "=",
        target.enquiryId ?? target.taskId!
      )
      .where("created_by", "=", actor)
      .where("action", "in", ["check-in", "check-out"])
      .orderBy("id", "desc")
      .executeTakeFirst();
    return { checkedIn: last?.action === "check-in" };
  }
  async list(target: WorkReportTarget) {
    return (await this.history(target, 1, 200)).items;
  }
  history(
    target: WorkReportTarget,
    page: number,
    pageSize: number,
    filter: WorkReportHistoryFilter = "all"
  ) {
    return new WorkReportHistory(this.db).page(target, page, pageSize, filter);
  }
  async create(input: WorkReportInput, context: WorkReportContext) {
    return this.db.transaction().execute(async (trx) => this.insert(trx, input, context, true));
  }
  async insert(
    trx: Transaction<WorkReportDatabase>,
    input: Omit<WorkReportInput, "action"> & { action: string },
    context: WorkReportContext,
    enforceAssignment = false
  ) {
    const parent = await this.target(input, trx, true);
    if (
      enforceAssignment &&
      (context.actorUserId === null || parent.assigned_user_id !== context.actorUserId)
    ) {
      await context.authorize(
        input.enquiryId !== null ? "crm.enquiry.view-all" : "crm.task.view-all"
      );
    }
    const prior = await trx
      .selectFrom("crm_work_reports")
      .selectAll()
      .where("created_by", "=", context.actorEmail)
      .where("request_id", "=", input.requestId)
      .executeTakeFirst();
    if (prior) {
      if (
        prior.enquiry_id !== input.enquiryId ||
        prior.task_id !== input.taskId ||
        prior.action !== input.action ||
        prior.body !== input.body ||
        (prior.amount === null ? null : Number(prior.amount)) !== input.amount ||
        (prior.latitude === null ? null : Number(prior.latitude)) !== input.latitude ||
        (prior.longitude === null ? null : Number(prior.longitude)) !== input.longitude ||
        (prior.accuracy_meters === null ? null : Number(prior.accuracy_meters)) !==
          input.accuracyMeters ||
        captureSecond(prior.captured_at) !== captureSecond(input.capturedAt)
      )
        throw AppError.conflict("This action retry key was already used for another report.");
      return prior;
    }
    if (input.action === "charge" || input.action === "collection") {
      if (input.amount === null || input.amount <= 0)
        throw AppError.validation("Enter an amount greater than zero.");
      if (input.action === "collection") {
        if (!input.body.trim()) throw AppError.validation("Enter collection notes.");
        const id = input.enquiryId ?? input.taskId!;
        const totals = await sql<{ charges: number | string; collections: number | string }>`
          SELECT COALESCE(SUM(CASE WHEN action='charge' THEN amount ELSE 0 END),0) AS charges,
            COALESCE(SUM(CASE WHEN action='collection' THEN amount ELSE 0 END),0) AS collections
          FROM crm_work_reports
          WHERE ${input.enquiryId !== null ? sql`enquiry_id=${id}` : sql`task_id=${id}`}
            AND status='active'
        `.execute(trx);
        const outstanding =
          Number(totals.rows[0]?.charges ?? 0) - Number(totals.rows[0]?.collections ?? 0);
        if (input.amount > outstanding + 0.00001)
          throw AppError.conflict(
            `Collection exceeds the outstanding amount of ${outstanding.toFixed(2)}.`
          );
      }
    }
    if (input.action === "check-in" || input.action === "check-out") {
      const status = await trx
        .selectFrom("crm_enquiry_statuses")
        .select("code")
        .where("id", "=", parent.status_id)
        .executeTakeFirst();
      if (status?.code === "closed")
        throw AppError.conflict("Closed work cannot accept a check-in or check-out.");
      const last = await trx
        .selectFrom("crm_work_reports")
        .select("action")
        .where(
          input.enquiryId !== null ? "enquiry_id" : "task_id",
          "=",
          input.enquiryId ?? input.taskId!
        )
        .where("created_by", "=", context.actorEmail)
        .where("action", "in", ["check-in", "check-out"])
        .orderBy("id", "desc")
        .executeTakeFirst();
      if (
        (input.action === "check-in" && last?.action === "check-in") ||
        (input.action === "check-out" && last?.action !== "check-in")
      )
        throw AppError.conflict(
          input.action === "check-in"
            ? "Check out before checking in again."
            : "Check in before checking out."
        );
    }
    const uuid = randomBytes(4).toString("hex");
    await trx
      .insertInto("crm_work_reports")
      .values({
        uuid,
        enquiry_id: input.enquiryId,
        task_id: input.taskId,
        action: input.action,
        body: input.body,
        amount: input.amount === null ? null : String(input.amount),
        request_id: input.requestId,
        latitude: input.latitude === null ? null : String(input.latitude),
        longitude: input.longitude === null ? null : String(input.longitude),
        accuracy_meters: input.accuracyMeters === null ? null : String(input.accuracyMeters),
        captured_at:
          input.capturedAt === null
            ? null
            : new Date(input.capturedAt).toISOString().slice(0, 19).replace("T", " "),
        created_by: context.actorEmail,
        created_at: sql`UTC_TIMESTAMP()`,
        updated_at: sql`UTC_TIMESTAMP()`
      })
      .execute();
    if (input.action === "check-out") {
      await this.insertCheckpointComment(trx, input, context);
    }
    const people = await trx
      .selectFrom("app_users")
      .select("email")
      .where("status", "=", "active")
      .where((eb) =>
        eb.or([eb("id", "=", parent.assigned_user_id ?? -1), eb("email", "=", parent.created_by)])
      )
      .execute();
    const assigningEvent =
      input.action === "assigned"
        ? null
        : await trx
            .selectFrom("crm_work_reports")
            .select("created_by")
            .where(
              input.enquiryId !== null ? "enquiry_id" : "task_id",
              "=",
              input.enquiryId ?? input.taskId!
            )
            .where("action", "=", "assigned")
            .orderBy("id", "desc")
            .executeTakeFirst();
    if (assigningEvent) {
      const assigningUser = await trx
        .selectFrom("app_users")
        .select("email")
        .where("email", "=", assigningEvent.created_by)
        .where("status", "=", "active")
        .executeTakeFirst();
      if (assigningUser) people.push(assigningUser);
    }
    const members = [...new Set(people.map((p) => p.email.toLowerCase()))];
    if (members.filter((email) => email !== context.actorEmail.toLowerCase()).length === 0) {
      const admins = await sql<{
        email: string;
      }>`SELECT DISTINCT u.email FROM app_users u JOIN app_user_roles ur ON ur.user_id=u.id JOIN app_roles r ON r.id=ur.role_id WHERE u.status='active' AND r.status='active' AND ur.status='active' AND r.\`key\` IN ('admin','super-admin','manager')`.execute(
        trx
      );
      members.push(...admins.rows.map((p) => p.email.toLowerCase()));
    }
    const label = input.enquiryId !== null ? "Enquiry" : "Task";
    const reference = `${label.toLowerCase()}:${input.enquiryId ?? input.taskId}`;
    const location =
      input.latitude === null
        ? ""
        : `\nGPS: ${input.latitude}, ${input.longitude} (accuracy ${input.accuracyMeters ?? "unknown"} m)\nCaptured: ${input.capturedAt}`;
    await context.sendMessage?.(trx, {
      title: `${label}: ${parent.title}`.slice(0, 120),
      reference,
      body: `${label} #${parent.id} · ${input.action}\n${input.body}${location}`,
      members: [...new Set([...members, context.actorEmail])],
      eventUuid: uuid
    });
    return trx
      .selectFrom("crm_work_reports")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirstOrThrow();
  }

  private async insertCheckpointComment(
    trx: Transaction<WorkReportDatabase>,
    input: Omit<WorkReportInput, "action"> & { action: string },
    context: WorkReportContext
  ) {
    if (input.action !== "check-out")
      throw AppError.validation("Only a completed check-out can be added as a cycle comment.");
    let checkInQuery = trx
      .selectFrom("crm_work_reports")
      .select(["body", "latitude", "longitude", "accuracy_meters", "captured_at"])
      .where("created_by", "=", context.actorEmail)
      .where("action", "=", "check-in");
    checkInQuery =
      input.enquiryId !== null
        ? checkInQuery.where("enquiry_id", "=", input.enquiryId)
        : checkInQuery.where("task_id", "=", input.taskId!);
    const checkIn = await checkInQuery.orderBy("id", "desc").executeTakeFirst();
    if (!checkIn) throw AppError.conflict("The check-in record for this work cycle was not found.");
    const body = checkpointCycleCommentBody(checkIn, {
      body: input.body,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracy_meters: input.accuracyMeters,
      captured_at: input.capturedAt
    });
    if (input.enquiryId !== null) {
      await trx
        .insertInto("crm_enquiry_comments")
        .values({
          request_id: input.requestId,
          enquiry_id: input.enquiryId,
          parent_id: null,
          body,
          body_format: "plain",
          status: "active",
          created_by: context.actorEmail,
          created_at: sql`UTC_TIMESTAMP()`,
          updated_at: sql`UTC_TIMESTAMP()`
        })
        .execute();
      await trx
        .insertInto("crm_enquiry_activity")
        .values({
          enquiry_id: input.enquiryId,
          action: "comment-added",
          details: body,
          status: "active",
          created_by: context.actorEmail,
          created_at: sql`UTC_TIMESTAMP()`,
          updated_at: sql`UTC_TIMESTAMP()`
        })
        .execute();
      return;
    }

    const taskId = input.taskId!;
    await trx
      .insertInto("crm_task_comments")
      .values({
        task_id: taskId,
        parent_id: null,
        body,
        created_by: context.actorEmail,
        status: "active",
        created_at: sql`UTC_TIMESTAMP()`,
        updated_at: sql`UTC_TIMESTAMP()`
      })
      .execute();
    await trx
      .insertInto("crm_task_activity")
      .values({
        task_id: taskId,
        event_type: "comment",
        description: body,
        actor: context.actorEmail,
        created_by: context.actorEmail,
        status: "active",
        created_at: sql`UTC_TIMESTAMP()`,
        updated_at: sql`UTC_TIMESTAMP()`
      })
      .execute();
  }
}

type CheckpointCommentDetails = {
  body: string;
  latitude: string | number | null;
  longitude: string | number | null;
  accuracy_meters: string | number | null;
  captured_at: string | Date | null;
};

export function checkpointCycleCommentBody(
  checkIn: CheckpointCommentDetails,
  checkOut: CheckpointCommentDetails
) {
  const details = (report: CheckpointCommentDetails) =>
    [
      report.body,
      `GPS: ${report.latitude}, ${report.longitude} · ${report.accuracy_meters ?? "unknown"} m`,
      `Captured @ ${formatCapturedAt(report.captured_at)}`
    ]
      .filter((part) => part.length > 0)
      .join("\n");
  return `Check in\n${details(checkIn)}\n\nCheck out\n${details(checkOut)}`;
}

function formatCapturedAt(value: string | Date | null) {
  if (value === null) return "unknown";
  const date =
    value instanceof Date
      ? value
      : new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return "unknown";
  return date.toISOString();
}

function captureSecond(value: string | Date | null) {
  if (value === null) return null;
  const date =
    value instanceof Date
      ? value
      : new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`);
  return Math.floor(date.getTime() / 1000);
}
