import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import { sql, type Kysely, type Transaction } from "kysely";
import type {
  DepartmentDatabase,
  DepartmentFilters,
  DepartmentInput,
  DepartmentStatus
} from "./department.types.js";

export class DepartmentRepository {
  constructor(private readonly database: Kysely<DepartmentDatabase>) {}

  async list(filters: DepartmentFilters) {
    let query = recordQuery(this.database);
    query = filters.deleted
      ? query.where("deleted_at", "is not", null)
      : query.where("deleted_at", "is", null);
    if (filters.status && filters.status !== "all")
      query = query.where("status", "=", filters.status);
    if (filters.search) {
      const term = `%${filters.search.replace(/[\\%_]/g, "\\$&")}%`;
      query = query.where((eb) =>
        eb.or([eb("name", "like", term), eb("description", "like", term)])
      );
    }
    return (await query.orderBy("name").orderBy("id").execute()).map(toRecord);
  }

  async get(id: string) {
    const row = await recordQuery(this.database).where("uuid", "=", id).executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  async duplicate(name: string, excluding?: string) {
    let query = this.database
      .selectFrom("hrms_departments")
      .select("uuid")
      .where("name", "=", name);
    if (excluding) query = query.where("uuid", "!=", excluding);
    return query.executeTakeFirst();
  }

  create(input: DepartmentInput, actor: string) {
    const id = randomBytes(4).toString("hex");
    return this.database.transaction().execute(async (database) => {
      await database
        .insertInto("hrms_departments")
        .values({ uuid: id, ...toRow(input) })
        .execute();
      await activity(database, id, "created", actor, `${input.name} created.`);
      return id;
    });
  }

  update(id: string, input: DepartmentInput, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockDepartment(database, id, false);
      await database
        .updateTable("hrms_departments")
        .set(toRow(input))
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(database, id, "updated", actor, `${input.name} updated.`);
    });
  }

  setStatus(id: string, status: DepartmentStatus, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockDepartment(database, id, false);
      await database
        .updateTable("hrms_departments")
        .set({ status })
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(
        database,
        id,
        status === "active" ? "activated" : "deactivated",
        actor,
        `Status changed to ${status}.`
      );
    });
  }

  remove(id: string, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockDepartment(database, id, false);
      await database
        .updateTable("hrms_departments")
        .set({ deleted_at: sql<string>`CURRENT_TIMESTAMP`, status: "inactive" })
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(database, id, "deleted", actor, "Moved to deleted departments.");
    });
  }

  restore(id: string, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockDepartment(database, id, true);
      await database
        .updateTable("hrms_departments")
        .set({ deleted_at: null, status: "inactive" })
        .where("uuid", "=", id)
        .where("deleted_at", "is not", null)
        .execute();
      await activity(database, id, "restored", actor, "Restored as inactive.");
    });
  }

  forceDelete(id: string, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockDepartment(database, id, true);
      await database.deleteFrom("hrms_departments").where("uuid", "=", id).execute();
      await activity(database, id, "force-deleted", actor, "Department permanently deleted.");
    });
  }

  async activity(id: string) {
    const rows = await this.database
      .selectFrom("hrms_department_activity")
      .select([
        "uuid as id",
        "action",
        "actor_email as actorEmail",
        "summary",
        "created_at as createdAt"
      ])
      .where("department_uuid", "=", id)
      .orderBy("id", "desc")
      .execute();
    return rows.map((row) => ({ ...row, createdAt: iso(row.createdAt)! }));
  }
}

function recordQuery(database: Kysely<DepartmentDatabase>) {
  return database
    .selectFrom("hrms_departments")
    .select([
      "uuid as id",
      "name",
      "description",
      "status",
      "created_at as createdAt",
      "updated_at as updatedAt",
      "deleted_at as deletedAt"
    ]);
}

function toRecord(
  row: Awaited<ReturnType<ReturnType<typeof recordQuery>["executeTakeFirstOrThrow"]>>
) {
  return {
    ...row,
    createdAt: iso(row.createdAt)!,
    updatedAt: iso(row.updatedAt)!,
    deletedAt: iso(row.deletedAt)
  };
}

function toRow(input: DepartmentInput) {
  return { name: input.name, description: input.description, status: input.status };
}

async function lockDepartment(
  database: Transaction<DepartmentDatabase>,
  id: string,
  deleted: boolean
) {
  const row = await database
    .selectFrom("hrms_departments")
    .select("deleted_at")
    .where("uuid", "=", id)
    .forUpdate()
    .executeTakeFirst();
  if (!row) throw AppError.notFound("Department was not found.");
  if (Boolean(row.deleted_at) !== deleted)
    throw AppError.conflict("Department lifecycle changed. Refresh and try again.");
}

function activity(
  database: Transaction<DepartmentDatabase>,
  id: string,
  action: string,
  actor: string,
  summary: string
) {
  return database
    .insertInto("hrms_department_activity")
    .values({
      uuid: randomBytes(4).toString("hex"),
      department_uuid: id,
      action,
      actor_email: actor,
      summary
    })
    .execute();
}

function iso(value: Date | string | null) {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  const text = value.replace(" ", "T");
  return new Date(text.endsWith("Z") ? text : `${text}Z`).toISOString();
}
