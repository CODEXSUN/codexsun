import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import type { ProgramPayload, ProgramRecord, PublicProgram } from "./program.types.js";

export class ProgramRepository {
  constructor(private readonly db: Kysely<SportsclubDatabase>) {}

  async list(): Promise<ProgramRecord[]> {
    const rows = await this.db
      .selectFrom("sportsclub_programs")
      .selectAll()
      .orderBy("sort_order", "asc")
      .orderBy("name", "asc")
      .execute();
    return rows.map(toRecord);
  }

  async listApprovedPublic(): Promise<PublicProgram[]> {
    const rows = await this.db
      .selectFrom("sportsclub_programs")
      .select(["uuid", "code", "name", "discipline", "description", "level", "age_group"])
      .where("status", "=", "active")
      .where("is_approved_public", "=", 1)
      .orderBy("sort_order", "asc")
      .orderBy("name", "asc")
      .execute();

    return rows.map((row) => ({
      uuid: row.uuid,
      code: row.code,
      name: row.name,
      discipline: row.discipline,
      description: row.description,
      level: row.level as PublicProgram["level"],
      ageGroup: row.age_group
    }));
  }

  async find(uuid: string): Promise<ProgramRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_programs")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async byCode(code: string): Promise<ProgramRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_programs")
      .selectAll()
      .where("code", "=", code.trim().toUpperCase())
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async save(uuid: string | null, value: ProgramPayload): Promise<ProgramRecord> {
    const key = uuid ?? randomBytes(4).toString("hex");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const code = value.code.trim().toUpperCase();

    const data = {
      code,
      name: value.name.trim(),
      discipline: value.discipline.trim(),
      description: value.description.trim(),
      level: value.level,
      age_group: value.ageGroup.trim(),
      is_approved_public: value.isApprovedPublic ? 1 : 0,
      status: value.status,
      sort_order: value.sortOrder,
      revision: value.revision + 1,
      updated_at: now
    };

    const current = uuid ? await this.find(uuid) : undefined;

    if (current) {
      const result = await this.db
        .updateTable("sportsclub_programs")
        .set(data)
        .where("uuid", "=", uuid)
        .where("revision", "=", value.revision)
        .executeTakeFirst();

      if (!Number(result.numUpdatedRows)) {
        throw AppError.conflict("This program changed. Reload before saving.");
      }
    } else {
      await this.db
        .insertInto("sportsclub_programs")
        .values({
          ...data,
          uuid: key,
          created_at: now
        })
        .execute();
    }

    return (await this.find(key))!;
  }

  async forceDelete(uuid: string): Promise<void> {
    const result = await this.db
      .deleteFrom("sportsclub_programs")
      .where("uuid", "=", uuid)
      .executeTakeFirst();

    if (!Number(result.numDeletedRows)) {
      throw AppError.notFound("Program not found.");
    }
  }
}

function toRecord(row: {
  uuid: string;
  code: string;
  name: string;
  discipline: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced" | "all_levels";
  age_group: string;
  is_approved_public: number;
  status: "active" | "inactive";
  sort_order: number;
  revision: number;
  created_at: string;
  updated_at: string;
}): ProgramRecord {
  return {
    uuid: row.uuid,
    code: row.code,
    name: row.name,
    discipline: row.discipline,
    description: row.description,
    level: row.level,
    ageGroup: row.age_group,
    isApprovedPublic: Boolean(row.is_approved_public),
    status: row.status,
    sortOrder: row.sort_order,
    revision: row.revision,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
