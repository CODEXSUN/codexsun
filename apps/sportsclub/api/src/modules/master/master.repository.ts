import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import type { MasterListQuery, MasterPayload, MasterRecord, PublicMaster } from "./master.types.js";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
  type ListResponse
} from "../../sportsclub.pagination.js";

export class MasterRepository {
  constructor(private readonly db: Kysely<SportsclubDatabase>) {}

  async list(query?: MasterListQuery): Promise<ListResponse<MasterRecord>> {
    const page = typeof query?.page === "number" ? query.page : Number(query?.page ?? 1) || 1;
    const pageSize = DEFAULT_PAGE_SIZE;
    const search = query?.search?.trim();

    let baseQuery = this.db.selectFrom("sportsclub_masters");

    if (query?.name?.trim()) baseQuery = baseQuery.where("name", "like", `%${query.name.trim()}%`);
    if (query?.email?.trim()) baseQuery = baseQuery.where("email", "like", `%${query.email.trim()}%`);
    if (query?.phone?.trim()) baseQuery = baseQuery.where("phone", "like", `%${query.phone.trim()}%`);
    if (query?.title?.trim()) baseQuery = baseQuery.where("title", "like", `%${query.title.trim()}%`);

    if (query?.primaryDiscipline) {
      baseQuery = baseQuery.where("primary_discipline", "like", `%${query.primaryDiscipline.trim()}%`);
    }
    if (query?.status) {
      baseQuery = baseQuery.where("status", "=", query.status);
    }
    if (query?.isApprovedPublic !== undefined) {
      baseQuery = baseQuery.where("is_approved_public", "=", query.isApprovedPublic ? 1 : 0);
    }
    if (search) {
      const term = `%${search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("name", "like", term),
          eb("title", "like", term),
          eb("primary_discipline", "like", term),
          eb("email", "like", term),
          eb("phone", "like", term)
        ])
      );
    }

    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQuery
      .selectAll()
      .orderBy("sort_order", "asc")
      .orderBy("name", "asc")
      .orderBy("id", "asc")
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .execute();

    const items = rows.map(toRecord);

    return {
      items,
      total,
      pagination: calculatePagination(total, page, pageSize)
    };
  }


  async listApprovedPublic(): Promise<PublicMaster[]> {
    const rows = await this.db
      .selectFrom("sportsclub_masters")
      .select(["uuid", "name", "title", "primary_discipline", "public_bio", "experience_years"])
      .where("status", "=", "active")
      .where("is_approved_public", "=", 1)
      .orderBy("sort_order", "asc")
      .orderBy("name", "asc")
      .execute();

    return rows.map((row) => ({
      uuid: row.uuid,
      name: row.name,
      title: row.title,
      primaryDiscipline: row.primary_discipline,
      publicBio: row.public_bio,
      experienceYears: row.experience_years
    }));
  }

  async find(uuid: string): Promise<MasterRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_masters")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async byEmail(email: string): Promise<MasterRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_masters")
      .selectAll()
      .where("email", "=", email.trim().toLowerCase())
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async save(uuid: string | null, value: MasterPayload): Promise<MasterRecord> {
    const key = uuid ?? randomBytes(4).toString("hex");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const email = value.email.trim().toLowerCase();

    const data = {
      email,
      name: value.name.trim(),
      phone: value.phone.trim(),
      title: value.title.trim(),
      primary_discipline: value.primaryDiscipline.trim(),
      public_bio: value.publicBio.trim(),
      private_notes: value.privateNotes.trim(),
      experience_years: value.experienceYears,
      is_approved_public: value.isApprovedPublic ? 1 : 0,
      status: value.status,
      sort_order: value.sortOrder,
      revision: value.revision + 1,
      updated_at: now
    };

    const current = uuid ? await this.find(uuid) : undefined;

    if (current && value.status !== "active") {
      const activeStudents = await this.db
        .selectFrom("sportsclub_members")
        .select("uuid")
        .where("master_uuid", "=", current.uuid)
        .where("status", "=", "active")
        .execute();
      if (activeStudents.length > 0) {
        throw AppError.conflict(
          "Reassign this master's students before changing their role or status."
        );
      }
    }

    if (current) {
      const result = await this.db
        .updateTable("sportsclub_masters")
        .set(data)
        .where("uuid", "=", uuid)
        .where("revision", "=", value.revision)
        .executeTakeFirst();

      if (!Number(result.numUpdatedRows)) {
        throw AppError.conflict("This master profile changed. Reload before saving.");
      }
    } else {
      await this.db
        .insertInto("sportsclub_masters")
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
    const activeStudents = await this.db
      .selectFrom("sportsclub_members")
      .select("uuid")
      .where("master_uuid", "=", uuid)
      .where("status", "=", "active")
      .execute();
    if (activeStudents.length > 0) {
      throw AppError.conflict(
        "Reassign this master's students before changing their role or status."
      );
    }

    const result = await this.db
      .deleteFrom("sportsclub_masters")
      .where("uuid", "=", uuid)
      .executeTakeFirst();

    if (!Number(result.numDeletedRows)) {
      throw AppError.notFound("Master not found.");
    }
  }
}

function toRecord(row: {
  uuid: string;
  email: string;
  name: string;
  phone: string;
  title: string;
  primary_discipline: string;
  public_bio: string;
  private_notes: string;
  experience_years: number;
  is_approved_public: number;
  status: "active" | "suspended";
  sort_order: number;
  revision: number;
  created_at: string;
  updated_at: string;
}): MasterRecord {
  return {
    uuid: row.uuid,
    email: row.email,
    name: row.name,
    phone: row.phone,
    title: row.title,
    primaryDiscipline: row.primary_discipline,
    publicBio: row.public_bio,
    privateNotes: row.private_notes,
    experienceYears: row.experience_years,
    isApprovedPublic: Boolean(row.is_approved_public),
    status: row.status,
    sortOrder: row.sort_order,
    revision: row.revision,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
