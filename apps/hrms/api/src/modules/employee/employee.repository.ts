import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import { sql, type Kysely, type Transaction } from "kysely";
import type {
  EmployeeDatabase,
  EmployeeFilters,
  EmployeeInput,
  EmployeeStatus
} from "./employee.types.js";

export class EmployeeRepository {
  constructor(private readonly database: Kysely<EmployeeDatabase>) {}

  async list(filters: EmployeeFilters) {
    let query = recordQuery(this.database);
    query = filters.deleted
      ? query.where("deleted_at", "is not", null)
      : query.where("deleted_at", "is", null);
    if (filters.status && filters.status !== "all")
      query = query.where("status", "=", filters.status);
    if (filters.search) {
      const term = `%${filters.search.replace(/[\\%_]/g, "\\$&")}%`;
      query = query.where((eb) =>
        eb.or([
          eb("employee_code", "like", term),
          eb("name", "like", term),
          eb("email", "like", term),
          eb("department", "like", term)
        ])
      );
    }
    return (await query.orderBy("name").orderBy("id").execute()).map(toRecord);
  }
  async get(id: string) {
    const row = await recordQuery(this.database).where("uuid", "=", id).executeTakeFirst();
    return row ? toRecord(row) : null;
  }
  async duplicate(code: string, userId: number | null, excluding?: string) {
    let query = this.database
      .selectFrom("hrms_employees")
      .select(["uuid", "employee_code", "user_id"])
      .where((eb) =>
        userId === null
          ? eb("employee_code", "=", code)
          : eb.or([eb("employee_code", "=", code), eb("user_id", "=", userId)])
      );
    if (excluding) query = query.where("uuid", "!=", excluding);
    return query.executeTakeFirst();
  }
  create(input: EmployeeInput, actor: string) {
    const id = randomBytes(4).toString("hex");
    return this.database.transaction().execute(async (db) => {
      await db
        .insertInto("hrms_employees")
        .values({ uuid: id, ...toRow(input) })
        .execute();
      await activity(db, id, "created", actor, `${input.employeeCode} created.`);
      return id;
    });
  }
  update(id: string, input: EmployeeInput, actor: string) {
    return this.database.transaction().execute(async (db) => {
      await lockEmployee(db, id, false);
      await db
        .updateTable("hrms_employees")
        .set(toRow(input))
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(db, id, "updated", actor, `${input.employeeCode} updated.`);
    });
  }
  setStatus(id: string, status: EmployeeStatus, actor: string) {
    return this.database.transaction().execute(async (db) => {
      await lockEmployee(db, id, false);
      await db
        .updateTable("hrms_employees")
        .set({ status })
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(
        db,
        id,
        status === "active" ? "restored" : "suspended",
        actor,
        `Status changed to ${status}.`
      );
    });
  }
  remove(id: string, actor: string) {
    return this.database.transaction().execute(async (db) => {
      await lockEmployee(db, id, false);
      await db
        .updateTable("hrms_employees")
        .set({ deleted_at: sql<string>`CURRENT_TIMESTAMP`, status: "inactive" })
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(
        db,
        id,
        "deleted",
        actor,
        "Moved to deleted employees; code and user mapping remain reserved."
      );
    });
  }
  restore(id: string, actor: string) {
    return this.database.transaction().execute(async (db) => {
      await lockEmployee(db, id, true);
      await db
        .updateTable("hrms_employees")
        .set({ deleted_at: null, status: "inactive" })
        .where("uuid", "=", id)
        .where("deleted_at", "is not", null)
        .execute();
      await activity(db, id, "undeleted", actor, "Restored from deleted employees as inactive.");
    });
  }
  forceDelete(id: string, actor: string) {
    return this.database.transaction().execute(async (db) => {
      await lockEmployee(db, id, true);
      await db
        .deleteFrom("hrms_employees")
        .where("uuid", "=", id)
        .where("deleted_at", "is not", null)
        .execute();
      await activity(
        db,
        id,
        "force-deleted",
        actor,
        "Employee permanently deleted; audit history retained."
      );
    });
  }
  async activity(id: string) {
    const rows = await this.database
      .selectFrom("hrms_employee_activity")
      .select([
        "uuid as id",
        "action",
        "actor_email as actorEmail",
        "summary",
        "created_at as createdAt"
      ])
      .where("employee_uuid", "=", id)
      .orderBy("id", "desc")
      .execute();
    return rows.map((row) => ({ ...row, createdAt: iso(row.createdAt)! }));
  }
}
// Public child-owned blocker used by the tenant user lifecycle.
export async function countEmployeeUserReferences(
  database: Kysely<EmployeeDatabase>,
  userId: number
) {
  const table = await sql<{
    count: number | string;
  }>`SELECT COUNT(*) count FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hrms_employees'`.execute(
    database
  );
  if (!Number(table.rows[0]?.count)) return 0;
  const result = await database
    .selectFrom("hrms_employees")
    .select(({ fn }) => fn.countAll<number>().as("count"))
    .where("user_id", "=", userId)
    .executeTakeFirstOrThrow();
  return Number(result.count);
}
async function lockEmployee(database: Transaction<EmployeeDatabase>, id: string, deleted: boolean) {
  const row = await database
    .selectFrom("hrms_employees")
    .select("deleted_at")
    .where("uuid", "=", id)
    .forUpdate()
    .executeTakeFirst();
  if (!row) throw AppError.notFound("Employee was not found.");
  if (Boolean(row.deleted_at) !== deleted)
    throw AppError.conflict("Employee lifecycle changed. Refresh and try again.");
}
function recordQuery(database: Kysely<EmployeeDatabase>) {
  return database
    .selectFrom("hrms_employees")
    .select([
      "uuid as id",
      "employee_code as employeeCode",
      "name",
      "email",
      "phone",
      "department",
      "designation",
      sql<string | null>`DATE_FORMAT(joining_date,'%Y-%m-%d')`.as("joiningDate"),
      "user_id as userId",
      "notes",
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
    userId: row.userId === null ? null : Number(row.userId),
    createdAt: iso(row.createdAt)!,
    updatedAt: iso(row.updatedAt)!,
    deletedAt: iso(row.deletedAt)
  };
}
function toRow(input: EmployeeInput) {
  return {
    employee_code: input.employeeCode,
    name: input.name,
    email: input.email,
    phone: input.phone,
    department: input.department,
    designation: input.designation,
    joining_date: input.joiningDate,
    user_id: input.userId,
    notes: input.notes,
    status: input.status
  };
}
function activity(
  db: Transaction<EmployeeDatabase>,
  id: string,
  action: string,
  actor: string,
  summary: string
) {
  return db
    .insertInto("hrms_employee_activity")
    .values({
      uuid: randomBytes(4).toString("hex"),
      employee_uuid: id,
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
