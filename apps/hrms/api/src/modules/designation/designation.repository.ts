import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import { sql, type Kysely, type Transaction } from "kysely";
import type {
  DesignationDatabase,
  DesignationFilters,
  DesignationInput,
  DesignationStatus
} from "./designation.types.js";

export class DesignationRepository {
  constructor(private readonly database: Kysely<DesignationDatabase>) {}

  async list(filters: DesignationFilters) {
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
      .selectFrom("hrms_designations")
      .select("uuid")
      .where("name", "=", name);
    if (excluding) query = query.where("uuid", "!=", excluding);
    return query.executeTakeFirst();
  }

  create(input: DesignationInput, actor: string) {
    const id = randomBytes(4).toString("hex");
    return this.database.transaction().execute(async (database) => {
      await database
        .insertInto("hrms_designations")
        .values({ uuid: id, ...toRow(input) })
        .execute();
      await activity(database, id, "created", actor, `${input.name} created.`);
      return id;
    });
  }

  update(id: string, input: DesignationInput, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockDesignation(database, id, false);
      await database
        .updateTable("hrms_designations")
        .set(toRow(input))
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(database, id, "updated", actor, `${input.name} updated.`);
    });
  }

  setStatus(id: string, status: DesignationStatus, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockDesignation(database, id, false);
      await database
        .updateTable("hrms_designations")
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
      await lockDesignation(database, id, false);
      await database
        .updateTable("hrms_designations")
        .set({ deleted_at: sql<string>`CURRENT_TIMESTAMP`, status: "inactive" })
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(database, id, "deleted", actor, "Moved to deleted designations.");
    });
  }

  restore(id: string, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockDesignation(database, id, true);
      await database
        .updateTable("hrms_designations")
        .set({ deleted_at: null, status: "inactive" })
        .where("uuid", "=", id)
        .where("deleted_at", "is not", null)
        .execute();
      await activity(database, id, "restored", actor, "Restored as inactive.");
    });
  }

  forceDelete(id: string, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockDesignation(database, id, true);
      await database.deleteFrom("hrms_designations").where("uuid", "=", id).execute();
      await activity(database, id, "force-deleted", actor, "Designation permanently deleted.");
    });
  }

  async activity(id: string) {
    const rows = await this.database
      .selectFrom("hrms_designation_activity")
      .select([
        "uuid as id",
        "action",
        "actor_email as actorEmail",
        "summary",
        "created_at as createdAt"
      ])
      .where("designation_uuid", "=", id)
      .orderBy("id", "desc")
      .execute();
    return rows.map((row) => ({ ...row, createdAt: iso(row.createdAt)! }));
  }
}

function recordQuery(database: Kysely<DesignationDatabase>) {
  return database
    .selectFrom("hrms_designations")
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

function toRow(input: DesignationInput) {
  return { name: input.name, description: input.description, status: input.status };
}

async function lockDesignation(
  database: Transaction<DesignationDatabase>,
  id: string,
  deleted: boolean
) {
  const row = await database
    .selectFrom("hrms_designations")
    .select("deleted_at")
    .where("uuid", "=", id)
    .forUpdate()
    .executeTakeFirst();
  if (!row) throw AppError.notFound("Designation was not found.");
  if (Boolean(row.deleted_at) !== deleted)
    throw AppError.conflict("Designation lifecycle changed. Refresh and try again.");
}

function activity(
  database: Transaction<DesignationDatabase>,
  id: string,
  action: string,
  actor: string,
  summary: string
) {
  return database
    .insertInto("hrms_designation_activity")
    .values({
      uuid: randomBytes(4).toString("hex"),
      designation_uuid: id,
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
