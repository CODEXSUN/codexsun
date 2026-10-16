import { AppError } from "@codexsun/framework/errors";
import type { Kysely } from "kysely";
import { getActiveListInForDatabase, type ListInDatabase } from "../list-in/index.js";
import { getActivePriorityForDatabase, type PriorityDatabase } from "../priority/index.js";
import { getActiveStatusForDatabase, type StatusDatabase } from "../status/index.js";
import { TaskRepository } from "./task.repository.js";
import type { TaskColumnFilters, TaskContext, TaskInput } from "./task.types.js";

type TaskMasterLookup = {
  list(id: number): Promise<unknown | null>;
  priority(id: number): Promise<unknown | null>;
  status(id: number): Promise<{ code: string } | null>;
};

function moduleMasterLookup(database: TaskContext["database"]): TaskMasterLookup {
  return {
    list: (id) => getActiveListInForDatabase(database as unknown as Kysely<ListInDatabase>, id),
    priority: (id) =>
      getActivePriorityForDatabase(database as unknown as Kysely<PriorityDatabase>, id),
    status: (id) => getActiveStatusForDatabase(database as unknown as Kysely<StatusDatabase>, id)
  };
}

export class TaskService {
  constructor(
    private readonly repo: TaskRepository,
    private readonly ctx: TaskContext,
    private readonly masterLookup = moduleMasterLookup(ctx.database)
  ) {}
  async list(
    search: string,
    page: number,
    pageSize: number,
    filter: string,
    columnFilters: TaskColumnFilters
  ) {
    return this.repo.list(
      this.ctx.canViewAll,
      this.ctx.actorEmail,
      this.ctx.actorUserId,
      search,
      page,
      pageSize,
      filter,
      columnFilters
    );
  }
  async get(id: number) {
    const row = await this.repo.get(
      id,
      this.ctx.canViewAll,
      this.ctx.actorEmail,
      this.ctx.actorUserId
    );
    if (!row) throw AppError.notFound("Task not found.");
    return row;
  }
  async save(input: TaskInput, id?: number) {
    if (!input.title.trim()) throw AppError.validation("Task title is required.");
    const existing = id === undefined ? null : await this.assertParticipant(id);
    if (!(await this.masterLookup.priority(input.priorityId)))
      throw AppError.validation("Select an active priority.");
    const status = await this.masterLookup.status(input.statusId);
    if (!status) throw AppError.validation("Select an active status.");
    if (status.code === "closed" && existing?.status !== "closed")
      throw AppError.validation("Tasks must be closed through an approved closure request.");
    if (input.listInId !== null && !(await this.masterLookup.list(input.listInId)))
      throw AppError.validation("Select an active list.");
    if (
      input.assignedUserId !== null &&
      !(await this.ctx.database
        .selectFrom("app_users")
        .select("id")
        .where("id", "=", input.assignedUserId)
        .where("status", "=", "active")
        .executeTakeFirst())
    )
      throw AppError.validation("Select an active assignee.");
    const savedId = await this.repo.save(input, this.ctx.actorEmail, id);
    return this.get(savedId);
  }
  async updateProperties(
    id: number,
    patch: {
      listInId?: number | null;
      priorityId?: number;
      statusId?: number;
      dueDate?: string | null;
    }
  ) {
    const current = await this.assertParticipant(id);
    if (patch.priorityId !== undefined && !(await this.masterLookup.priority(patch.priorityId)))
      throw AppError.validation("Select an active priority.");
    if (patch.statusId !== undefined) {
      if (current.status === "closed" && !this.ctx.canViewAll)
        throw AppError.forbidden("A closed task can only be reopened by a CRM task manager.");
      const status = await this.masterLookup.status(patch.statusId);
      if (!status) throw AppError.validation("Select an active status.");
      if (status.code === "closed")
        throw AppError.validation("Tasks must be closed through an approved closure request.");
    }
    if (
      patch.listInId !== undefined &&
      patch.listInId !== null &&
      !(await this.masterLookup.list(patch.listInId))
    )
      throw AppError.validation("Select an active list.");
    await this.repo.patchProperties(id, this.ctx.actorEmail, patch);
    return this.get(id);
  }
  async assertParticipant(id: number) {
    const task = await this.get(id);
    if (
      this.ctx.canViewAll ||
      task.createdBy.toLowerCase() === this.ctx.actorEmail.toLowerCase() ||
      task.assignedUserId === this.ctx.actorUserId
    )
      return task;
    throw AppError.forbidden(
      "Only the task creator, assignee, or a CRM task manager can act on this task."
    );
  }
}
