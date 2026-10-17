import { randomBytes } from "node:crypto";
import { sql, type Kysely, type Transaction } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { listActiveListInsForDatabase, type ListInDatabase } from "../list-in/index.js";
import { listActivePrioritiesForDatabase, type PriorityDatabase } from "../priority/index.js";
import { listActiveStatusesForDatabase, type StatusDatabase } from "../status/index.js";
import type {
  TaskColumnFilters,
  TaskDatabase,
  TaskInput,
  TaskRecord,
  TaskContext
} from "./task.types.js";

type TaskExecutor = Kysely<TaskDatabase> | Transaction<TaskDatabase>;

export class TaskRepository {
  constructor(
    private readonly db: Kysely<TaskDatabase>,
    private readonly workEvent?: TaskContext["workEvent"]
  ) {}
  private query() {
    return this.db
      .selectFrom("crm_tasks as t")
      .leftJoin("core_contacts as contact", "contact.id", "t.contact_id")
      .leftJoin("crm_enquiry_lists as l", "l.id", "t.list_in_id")
      .innerJoin("crm_enquiry_priorities as p", "p.id", "t.priority_id")
      .innerJoin("crm_enquiry_statuses as s", "s.id", "t.status_id")
      .leftJoin("app_users as a", "a.id", "t.assigned_user_id")
      .leftJoin("app_users as c", "c.email", "t.created_by")
      .select([
        "t.id",
        "t.uuid",
        "t.title",
        "t.description",
        "t.contact_id",
        "contact.name as contact_name",
        "contact.primary_phone as contact_phone",
        "t.list_in_id",
        "l.name as list_in",
        "t.priority_id",
        "p.code as priority",
        "p.name as priority_name",
        "t.status_id",
        "s.code as status",
        "s.name as status_name",
        "t.assigned_user_id",
        "a.name as assigned_to",
        "t.due_date",
        "t.created_by",
        "c.name as creator_name",
        "t.created_at",
        "t.updated_at"
      ]);
  }
  async list(
    canViewAll: boolean,
    email: string,
    userId: number | null,
    search: string,
    page: number,
    pageSize: number,
    filter: string,
    columnFilters: TaskColumnFilters
  ) {
    let q = this.query();
    if (!canViewAll) {
      q = q.where((eb) =>
        eb.or([
          ...(userId === null ? [] : [eb("t.assigned_user_id", "=", userId)]),
          eb("t.created_by", "=", email)
        ])
      );
    }
    if (search)
      q = q.where((eb) =>
        eb.or([
          eb("t.title", "like", `%${search}%`),
          eb("t.description", "like", `%${search}%`),
          eb("l.name", "like", `%${search}%`),
          eb("s.name", "like", `%${search}%`),
          eb("p.name", "like", `%${search}%`),
          eb("a.name", "like", `%${search}%`)
        ])
      );
    if (columnFilters.title) q = q.where("t.title", "like", `%${columnFilters.title}%`);
    if (columnFilters.listIn) q = q.where("l.name", "like", `%${columnFilters.listIn}%`);
    if (columnFilters.dueDate) q = q.where("t.due_date", "like", `%${columnFilters.dueDate}%`);
    if (columnFilters.priority) q = q.where("p.name", "like", `%${columnFilters.priority}%`);
    if (columnFilters.creator)
      q = q.where((eb) =>
        eb.or([
          eb("c.name", "like", `%${columnFilters.creator}%`),
          eb("t.created_by", "like", `%${columnFilters.creator}%`)
        ])
      );
    if (columnFilters.assignedTo) q = q.where("a.name", "like", `%${columnFilters.assignedTo}%`);
    if (columnFilters.status) q = q.where("s.name", "like", `%${columnFilters.status}%`);
    const statusQuery = q;
    const holds = ["hold-for-approval", "long-hold", "hold-for-spares", "hold-for-job-out"];
    if (filter === "active") q = q.where("s.code", "not in", ["won", "lost", "closed"]);
    else if (filter === "hold") q = q.where("s.code", "in", holds);
    else if (filter === "pending-group")
      q = q.where("s.code", "in", ["open", "reopen", "escalation"]);
    else if (filter === "other")
      q = q.where("s.code", "not in", [
        "new",
        "open",
        "reopen",
        "escalation",
        ...holds,
        "won",
        "lost",
        "closed"
      ]);
    else if (filter && filter !== "all") q = q.where("s.code", "=", filter);
    const [rows, count, statusCounts] = await Promise.all([
      q
        .orderBy("t.id", "desc")
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute(),
      q
        .clearSelect()
        .select(({ fn }) => fn.count<number>("t.id").as("total"))
        .executeTakeFirstOrThrow(),
      statusQuery
        .clearSelect()
        .select("s.code as code")
        .select(({ fn }) => fn.count<number>("t.id").as("count"))
        .groupBy("s.code")
        .execute()
    ]);
    const ids = rows.map((row) => Number(row.id));
    const pendingRows = ids.length
      ? await this.db
          .selectFrom("crm_task_closure_requests")
          .select("task_id")
          .where("status", "=", "pending")
          .where("task_id", "in", ids)
          .execute()
      : [];
    const pending = new Set(pendingRows.map((row) => Number(row.task_id)));
    return {
      items: rows.map((row) => this.map(row, pending.has(Number(row.id)))),
      statusCounts: statusCounts.map((row) => ({ code: row.code, count: Number(row.count) })),
      total: Number(count.total)
    };
  }
  async get(id: number, canViewAll: boolean, email: string, userId: number | null) {
    let q = this.query().where("t.id", "=", id);
    if (!canViewAll) {
      q = q.where((eb) =>
        eb.or([
          ...(userId === null ? [] : [eb("t.assigned_user_id", "=", userId)]),
          eb("t.created_by", "=", email)
        ])
      );
    }
    const row = await q.executeTakeFirst();
    if (!row) return null;
    const pending = await this.db
      .selectFrom("crm_task_closure_requests")
      .select("id")
      .where("task_id", "=", id)
      .where("status", "=", "pending")
      .executeTakeFirst();
    return this.map(row, Boolean(pending));
  }
  async save(
    input: TaskInput,
    actor: string,
    id?: number,
    resolveContact?: TaskContext["resolveContact"]
  ) {
    const creating = id === undefined;
    return this.db.transaction().execute(async (trx) => {
      const contactId = resolveContact ? await resolveContact(input, trx) : input.contactId;
      if (id !== undefined) {
        await trx
          .updateTable("crm_tasks")
          .set({
            updated_at: sql`UTC_TIMESTAMP()`,
            contact_id: contactId,
            title: input.title,
            description: input.description,
            list_in_id: input.listInId,
            priority_id: input.priorityId,
            status_id: input.statusId,
            assigned_user_id: input.assignedUserId,
            due_date: input.dueDate
          })
          .where("id", "=", id)
          .execute();
      } else {
        const result = await trx
          .insertInto("crm_tasks")
          .values({
            uuid: publicUuid(),
            contact_id: contactId ?? null,
            title: input.title,
            description: input.description,
            list_in_id: input.listInId,
            priority_id: input.priorityId,
            status_id: input.statusId,
            assigned_user_id: input.assignedUserId,
            due_date: input.dueDate,
            created_by: actor,
            created_at: sql`UTC_TIMESTAMP()`,
            updated_at: sql`UTC_TIMESTAMP()`
          })
          .executeTakeFirstOrThrow();
        id = Number(result.insertId);
      }
      await this.insertActivity(
        trx,
        id,
        creating ? "created" : "updated",
        creating ? "Task created." : "Task details updated.",
        actor
      );
      await this.workEvent?.(trx, id, "assigned", input.description || input.title);
      return id;
    });
  }
  async patchProperties(
    id: number,
    actor: string,
    patch: {
      listInId?: number | null;
      priorityId?: number;
      statusId?: number;
      dueDate?: string | null;
    }
  ) {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable("crm_tasks")
        .set({
          updated_at: sql`UTC_TIMESTAMP()`,
          ...(patch.listInId !== undefined ? { list_in_id: patch.listInId } : {}),
          ...(patch.priorityId !== undefined ? { priority_id: patch.priorityId } : {}),
          ...(patch.statusId !== undefined ? { status_id: patch.statusId } : {}),
          ...(patch.dueDate !== undefined ? { due_date: patch.dueDate } : {})
        })
        .where("id", "=", id)
        .execute();
      await this.insertActivity(trx, id, "properties-updated", "Task properties updated.", actor);
    });
  }
  async addActivity(taskId: number, eventType: string, description: string, actor: string) {
    await this.insertActivity(this.db, taskId, eventType, description, actor);
  }
  private async insertActivity(
    db: TaskExecutor,
    taskId: number,
    eventType: string,
    description: string,
    actor: string
  ) {
    await db
      .insertInto("crm_task_activity")
      .values({
        uuid: publicUuid(),
        task_id: taskId,
        event_type: eventType,
        description,
        actor,
        created_by: actor,
        created_at: sql`UTC_TIMESTAMP()`,
        updated_at: sql`UTC_TIMESTAMP()`
      })
      .execute();
    if (db.isTransaction && eventType !== "created" && eventType !== "updated")
      await this.workEvent?.(db as Transaction<TaskDatabase>, taskId, eventType, description);
  }
  async activity(taskId: number) {
    return this.db
      .selectFrom("crm_task_activity")
      .select([
        "id",
        "uuid",
        "task_id as taskId",
        "event_type as eventType",
        "description",
        "actor",
        "created_at as createdAt"
      ])
      .where("task_id", "=", taskId)
      .orderBy("id", "desc")
      .limit(200)
      .execute();
  }
  async options(includeUsers: boolean) {
    const [lists, statuses, priorities, users] = await Promise.all([
      listActiveListInsForDatabase(this.db as unknown as Kysely<ListInDatabase>),
      listActiveStatusesForDatabase(this.db as unknown as Kysely<StatusDatabase>),
      listActivePrioritiesForDatabase(this.db as unknown as Kysely<PriorityDatabase>),
      includeUsers
        ? this.db
            .selectFrom("app_users")
            .select(["id", "name", "email", "status"])
            .where("status", "=", "active")
            .orderBy("name")
            .execute()
        : Promise.resolve([])
    ]);
    return {
      lists: lists.map(({ id, name, status }) => ({ id, name, status })),
      statuses: statuses.map(({ id, name, code, status }) => ({ id, name, code, status })),
      priorities: priorities.map(({ id, name, code, status }) => ({ id, name, code, status })),
      users
    };
  }
  async addComment(taskId: number, body: string, actor: string) {
    return this.db.transaction().execute(async (trx) => {
      const result = await trx
        .insertInto("crm_task_comments")
        .values({
          uuid: publicUuid(),
          task_id: taskId,
          body,
          created_by: actor,
          created_at: sql`UTC_TIMESTAMP()`,
          updated_at: sql`UTC_TIMESTAMP()`
        })
        .executeTakeFirstOrThrow();
      await this.insertActivity(trx, taskId, "comment", body, actor);
      return trx
        .selectFrom("crm_task_comments")
        .select([
          "id",
          "uuid",
          "task_id as taskId",
          "body",
          "created_by as createdBy",
          "created_at as createdAt"
        ])
        .where("id", "=", Number(result.insertId))
        .executeTakeFirstOrThrow();
    });
  }
  async comments(taskId: number) {
    return this.db
      .selectFrom("crm_task_comments")
      .select([
        "id",
        "uuid",
        "task_id as taskId",
        "body",
        "created_by as createdBy",
        "created_at as createdAt"
      ])
      .where("task_id", "=", taskId)
      .orderBy("id")
      .execute();
  }
  async startJob(taskId: number, actor: string) {
    return this.db.transaction().execute(async (trx) => {
      const task = await trx
        .selectFrom("crm_tasks as task")
        .innerJoin("crm_enquiry_statuses as task_status", "task_status.id", "task.status_id")
        .select("task_status.code as statusCode")
        .where("task.id", "=", taskId)
        .forUpdate()
        .executeTakeFirst();
      if (!task) throw AppError.notFound("Task not found.");
      if (task.statusCode === "closed") throw AppError.conflict("A closed task cannot be started.");
      const closurePending = await trx
        .selectFrom("crm_task_closure_requests")
        .select("id")
        .where("task_id", "=", taskId)
        .where("status", "=", "pending")
        .executeTakeFirst();
      if (closurePending)
        throw AppError.conflict("A task with a pending closure request cannot be started.");
      const active = await trx
        .selectFrom("crm_task_jobs")
        .select("id")
        .where("task_id", "=", taskId)
        .where("stopped_at", "is", null)
        .executeTakeFirst();
      if (active) throw AppError.conflict("A task timer is already running.");
      const result = await trx
        .insertInto("crm_task_jobs")
        .values({
          uuid: publicUuid(),
          task_id: taskId,
          started_by: actor,
          started_at: sql`UTC_TIMESTAMP()`,
          created_by: actor,
          created_at: sql`UTC_TIMESTAMP()`,
          updated_at: sql`UTC_TIMESTAMP()`
        })
        .executeTakeFirstOrThrow();
      await this.insertActivity(trx, taskId, "job-started", "Job timer started.", actor);
      return trx
        .selectFrom("crm_task_jobs")
        .select([
          "id",
          "uuid",
          "task_id as taskId",
          "started_by as startedBy",
          "started_at as startedAt",
          "stopped_at as stoppedAt"
        ])
        .where("id", "=", Number(result.insertId))
        .executeTakeFirstOrThrow();
    });
  }
  async stopJob(taskId: number, actor: string, canManage: boolean) {
    await this.db.transaction().execute(async (trx) => {
      let q = trx
        .updateTable("crm_task_jobs")
        .where("task_id", "=", taskId)
        .where("stopped_at", "is", null);
      if (!canManage) q = q.where("started_by", "=", actor);
      const result = await q
        .set({
          updated_at: sql`UTC_TIMESTAMP()`,
          stopped_at: new Date().toISOString().slice(0, 19).replace("T", " "),
          status: "inactive"
        })
        .executeTakeFirst();
      if (!Number(result.numUpdatedRows))
        throw AppError.conflict("No active task timer is assigned to you.");
      await this.insertActivity(trx, taskId, "job-stopped", "Job timer stopped.", actor);
    });
  }
  async jobs(taskId: number) {
    return this.db
      .selectFrom("crm_task_jobs")
      .select([
        "id",
        "uuid",
        "task_id as taskId",
        "started_by as startedBy",
        "started_at as startedAt",
        "stopped_at as stoppedAt"
      ])
      .where("task_id", "=", taskId)
      .orderBy("id", "desc")
      .execute();
  }
  async requestClosure(taskId: number, actor: string, reason: string) {
    return this.db.transaction().execute(async (trx) => {
      const task = await trx
        .selectFrom("crm_tasks as task")
        .innerJoin("crm_enquiry_statuses as task_status", "task_status.id", "task.status_id")
        .select("task_status.code as statusCode")
        .where("task.id", "=", taskId)
        .forUpdate()
        .executeTakeFirst();
      if (!task) throw AppError.notFound("Task not found.");
      if (task.statusCode === "closed")
        throw AppError.conflict("A closure request is not needed for a closed task.");
      const pending = await trx
        .selectFrom("crm_task_closure_requests")
        .select("id")
        .where("task_id", "=", taskId)
        .where("status", "=", "pending")
        .executeTakeFirst();
      if (pending) throw AppError.conflict("A closure request is already pending.");
      const activeJob = await trx
        .selectFrom("crm_task_jobs")
        .select("id")
        .where("task_id", "=", taskId)
        .where("stopped_at", "is", null)
        .executeTakeFirst();
      if (activeJob)
        throw AppError.conflict("Stop the running task timer before requesting closure.");
      const result = await trx
        .insertInto("crm_task_closure_requests")
        .values({
          uuid: publicUuid(),
          task_id: taskId,
          requested_by: actor,
          created_by: actor,
          created_at: sql`UTC_TIMESTAMP()`,
          updated_at: sql`UTC_TIMESTAMP()`,
          reason,
          status: "pending",
          reviewed_by: null,
          review_note: null
        })
        .executeTakeFirstOrThrow();
      await this.insertActivity(
        trx,
        taskId,
        "closure-requested",
        `Closure requested: ${reason}`,
        actor
      );
      return trx
        .selectFrom("crm_task_closure_requests")
        .select([
          "id",
          "uuid",
          "task_id as taskId",
          "requested_by as requestedBy",
          "reason",
          "status",
          "reviewed_by as reviewedBy",
          "review_note as reviewNote",
          "created_at as createdAt"
        ])
        .where("id", "=", Number(result.insertId))
        .executeTakeFirstOrThrow();
    });
  }
  async closureRequests(taskId: number) {
    return this.db
      .selectFrom("crm_task_closure_requests")
      .select([
        "id",
        "uuid",
        "task_id as taskId",
        "requested_by as requestedBy",
        "reason",
        "status",
        "reviewed_by as reviewedBy",
        "review_note as reviewNote",
        "created_at as createdAt"
      ])
      .where("task_id", "=", taskId)
      .orderBy("id", "desc")
      .execute();
  }
  async reviewClosure(id: number, actor: string, decision: "approved" | "rejected", note: string) {
    return this.db.transaction().execute(async (trx) => {
      const request = await trx
        .selectFrom("crm_task_closure_requests")
        .select(["id", "task_id"])
        .where("id", "=", id)
        .where("status", "=", "pending")
        .forUpdate()
        .executeTakeFirst();
      if (!request) return false;
      await trx
        .selectFrom("crm_tasks")
        .select("id")
        .where("id", "=", request.task_id)
        .forUpdate()
        .executeTakeFirst();
      const closed =
        decision === "approved"
          ? await trx
              .selectFrom("crm_enquiry_statuses")
              .select("id")
              .where("code", "=", "closed")
              .where("status", "=", "active")
              .executeTakeFirst()
          : null;
      if (decision === "approved" && !closed)
        throw AppError.conflict("The active Closed status is not configured.");
      const result = await trx
        .updateTable("crm_task_closure_requests")
        .set({
          updated_at: sql`UTC_TIMESTAMP()`,
          status: decision,
          reviewed_by: actor,
          review_note: note
        })
        .where("id", "=", id)
        .where("status", "=", "pending")
        .executeTakeFirst();
      if (!Number(result.numUpdatedRows)) return false;
      if (closed)
        await trx
          .updateTable("crm_tasks")
          .set({ updated_at: sql`UTC_TIMESTAMP()`, status_id: closed.id })
          .where("id", "=", request.task_id)
          .execute();
      await this.insertActivity(
        trx,
        Number(request.task_id),
        `closure-${decision}`,
        `Closure request ${decision}${note ? `: ${note}` : "."}`,
        actor
      );
      return true;
    });
  }
  private map(
    row: {
      id: number;
      uuid: string;
      title: string;
      description: string;
      contact_id: number | null;
      contact_name: string | null;
      contact_phone: string | null;
      list_in_id: number | null;
      list_in: string | null;
      priority_id: number;
      priority: string;
      priority_name: string;
      status_id: number;
      status: string;
      status_name: string;
      assigned_user_id: number | null;
      assigned_to: string | null;
      due_date: string | null;
      created_by: string;
      creator_name: string | null;
      created_at: string;
      updated_at: string;
    },
    closurePending: boolean
  ): TaskRecord {
    return {
      id: Number(row.id),
      uuid: row.uuid,
      title: row.title,
      description: row.description,
      contactId: row.contact_id === null ? null : Number(row.contact_id),
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      listInId: row.list_in_id === null ? null : Number(row.list_in_id),
      listIn: row.list_in,
      priorityId: Number(row.priority_id),
      priority: row.priority,
      priorityName: row.priority_name,
      statusId: Number(row.status_id),
      status: row.status,
      statusName: row.status_name,
      assignedUserId: row.assigned_user_id === null ? null : Number(row.assigned_user_id),
      assignedTo: row.assigned_to,
      dueDate: row.due_date === null ? null : String(row.due_date).slice(0, 10),
      createdBy: row.created_by,
      creatorName: row.creator_name ?? row.created_by,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      closurePending
    };
  }
}

function publicUuid() {
  return randomBytes(4).toString("hex");
}
