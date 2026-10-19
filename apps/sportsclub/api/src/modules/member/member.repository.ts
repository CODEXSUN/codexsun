import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import type { MemberActivity, MemberListQuery, MemberPayload, MemberRecord } from "./member.types.js";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
  type ListResponse
} from "../../sportsclub.pagination.js";

export class MemberRepository {
  constructor(private readonly db: Kysely<SportsclubDatabase>) {}

  async programUuidsForMaster(masterUuid: string): Promise<string[]> {
    const rows = await this.db.selectFrom("sportsclub_members")
      .select("program_uuid")
      .distinct()
      .where("master_uuid", "=", masterUuid)
      .where("program_uuid", "is not", null)
      .execute();
    return rows.flatMap((row) => row.program_uuid ? [row.program_uuid] : []);
  }

  async listAll(): Promise<MemberRecord[]> {
    const rows = await this.db
      .selectFrom("sportsclub_members")
      .selectAll()
      .orderBy("name", "asc")
      .orderBy("id", "asc")
      .execute();
    return rows.map(toRecord);
  }

  async list(query?: MemberListQuery): Promise<ListResponse<MemberRecord>> {
    const page = typeof query?.page === "number" ? query.page : Number(query?.page ?? 1) || 1;
    const pageSize = DEFAULT_PAGE_SIZE;
    const search = query?.search?.trim();

    let baseQuery = this.db.selectFrom("sportsclub_members");

    if (query?.name?.trim()) baseQuery = baseQuery.where("name", "like", `%${query.name.trim()}%`);
    if (query?.email?.trim()) baseQuery = baseQuery.where("email", "like", `%${query.email.trim()}%`);
    if (query?.phone?.trim()) baseQuery = baseQuery.where("phone", "like", `%${query.phone.trim()}%`);

    if (query?.role) {
      baseQuery = baseQuery.where("role", "=", query.role);
    }
    if (query?.status) {
      baseQuery = baseQuery.where("status", "=", query.status);
    }
    if (query?.programUuid) {
      baseQuery = baseQuery.where("program_uuid", "=", query.programUuid);
    }
    if (query?.masterUuid) {
      baseQuery = baseQuery.where("master_uuid", "=", query.masterUuid);
    }
    if (search) {
      const term = `%${search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("name", "like", term),
          eb("email", "like", term),
          eb("phone", "like", term),
          eb("guardian_name", "like", term),
          eb("address", "like", term)
        ])
      );
    }

    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQuery
      .selectAll()
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


  async find(uuid: string): Promise<MemberRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_members")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async byEmail(email: string): Promise<MemberRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_members")
      .selectAll()
      .where("email", "=", email.trim().toLowerCase())
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async studentsByMaster(masterUuid: string): Promise<MemberRecord[]> {
    const rows = await this.db
      .selectFrom("sportsclub_members")
      .selectAll()
      .where("master_uuid", "=", masterUuid)
      .where("role", "=", "student")
      .orderBy("name", "asc")
      .execute();
    return rows.map(toRecord);
  }

  async save(
    uuid: string | null,
    value: MemberPayload,
    actor: string,
    action: string,
    details = ""
  ): Promise<MemberRecord> {
    const key = uuid ?? randomBytes(4).toString("hex");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const email = value.email.trim().toLowerCase();

    const current = uuid ? await this.find(uuid) : undefined;

    await this.db.transaction().execute(async (tx) => {
      const data = {
        email,
        name: value.name.trim(),
        phone: value.phone.trim(),
        date_of_birth: value.dateOfBirth ?? null,
        gender: value.gender ?? null,
        guardian_name: value.guardianName ?? null,
        guardian_phone: value.guardianPhone ?? null,
        emergency_contact: value.emergencyContact ?? null,
        medical_notes: value.medicalNotes.trim(),
        address: value.address.trim(),
        program_uuid: value.programUuid ?? null,
        master_uuid: value.masterUuid ?? null,
        role: value.role,
        status: value.status,
        progress_note: value.progressNote.trim(),
        revision: value.revision + 1,
        updated_at: now
      };

      if (current) {
        const result = await tx
          .updateTable("sportsclub_members")
          .set(data)
          .where("uuid", "=", uuid)
          .where("revision", "=", value.revision)
          .executeTakeFirst();

        if (!Number(result.numUpdatedRows)) {
          throw AppError.conflict("This member record changed. Reload before saving.");
        }
      } else {
        await tx
          .insertInto("sportsclub_members")
          .values({
            ...data,
            uuid: key,
            created_at: now
          })
          .execute();
      }

      await tx
        .insertInto("sportsclub_activity")
        .values({
          uuid: randomBytes(4).toString("hex"),
          entity_type: "member",
          entity_uuid: key,
          actor,
          action,
          details: details || `${action} for ${value.name} (${value.role})`,
          created_at: now
        })
        .execute();
    });

    return (await this.find(key))!;
  }

  async activity(memberUuid: string): Promise<MemberActivity[]> {
    const rows = await this.db
      .selectFrom("sportsclub_activity")
      .select(["uuid", "entity_uuid", "actor", "action", "details", "created_at"])
      .where("entity_type", "=", "member")
      .where("entity_uuid", "=", memberUuid)
      .orderBy("id", "desc")
      .limit(50)
      .execute();

    return rows.map((r) => ({
      uuid: r.uuid,
      memberUuid: r.entity_uuid,
      actor: r.actor,
      action: r.action,
      details: r.details,
      createdAt: String(r.created_at)
    }));
  }
}

function toRecord(row: {
  uuid: string;
  email: string;
  name: string;
  phone: string;
  date_of_birth: string | null;
  gender: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  emergency_contact: string | null;
  medical_notes: string;
  address: string;
  program_uuid: string | null;
  master_uuid: string | null;
  role: "student" | "master";
  status: "pending" | "active" | "suspended" | "graduated";
  progress_note: string;
  revision: number;
  created_at: string;
  updated_at: string;
}): MemberRecord {
  return {
    uuid: row.uuid,
    email: row.email,
    name: row.name,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    guardianName: row.guardian_name,
    guardianPhone: row.guardian_phone,
    emergencyContact: row.emergency_contact,
    medicalNotes: row.medical_notes,
    address: row.address,
    programUuid: row.program_uuid,
    masterUuid: row.master_uuid,
    role: row.role,
    status: row.status,
    progressNote: row.progress_note,
    revision: row.revision,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
