import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import type { PublicSession, SessionPayload, SessionRecord } from "./session.types.js";

export class SessionRepository {
  constructor(private readonly db: Kysely<SportsclubDatabase>) {}

  async list(): Promise<SessionRecord[]> {
    const rows = await this.db
      .selectFrom("sportsclub_sessions")
      .selectAll()
      .orderBy("start_time", "asc")
      .execute();
    return rows.map(toRecord);
  }

  async listApprovedPublic(): Promise<PublicSession[]> {
    const rows = await this.db
      .selectFrom("sportsclub_sessions")
      .select([
        "uuid",
        "title",
        "program_uuid",
        "master_uuid",
        "days_of_week",
        "start_time",
        "end_time",
        "venue"
      ])
      .where("status", "=", "active")
      .where("is_approved_public", "=", 1)
      .orderBy("start_time", "asc")
      .execute();

    return rows.map((row) => ({
      uuid: row.uuid,
      title: row.title,
      programUuid: row.program_uuid,
      masterUuid: row.master_uuid,
      daysOfWeek: row.days_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      venue: row.venue
    }));
  }

  async find(uuid: string): Promise<SessionRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_sessions")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async save(uuid: string | null, value: SessionPayload): Promise<SessionRecord> {
    const key = uuid ?? randomBytes(4).toString("hex");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const data = {
      title: value.title.trim(),
      program_uuid: value.programUuid,
      master_uuid: value.masterUuid,
      days_of_week: value.daysOfWeek.trim(),
      start_time: value.startTime.trim(),
      end_time: value.endTime.trim(),
      venue: value.venue.trim(),
      max_capacity: value.maxCapacity,
      is_approved_public: value.isApprovedPublic ? 1 : 0,
      status: value.status,
      revision: value.revision + 1,
      updated_at: now
    };

    const current = uuid ? await this.find(uuid) : undefined;

    if (current) {
      const result = await this.db
        .updateTable("sportsclub_sessions")
        .set(data)
        .where("uuid", "=", uuid)
        .where("revision", "=", value.revision)
        .executeTakeFirst();

      if (!Number(result.numUpdatedRows)) {
        throw AppError.conflict("This session changed. Reload before saving.");
      }
    } else {
      await this.db
        .insertInto("sportsclub_sessions")
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
      .deleteFrom("sportsclub_sessions")
      .where("uuid", "=", uuid)
      .executeTakeFirst();

    if (!Number(result.numDeletedRows)) {
      throw AppError.notFound("Session not found.");
    }
  }
}

function toRecord(row: {
  uuid: string;
  title: string;
  program_uuid: string;
  master_uuid: string | null;
  days_of_week: string;
  start_time: string;
  end_time: string;
  venue: string;
  max_capacity: number;
  is_approved_public: number;
  status: "active" | "cancelled";
  revision: number;
  created_at: string;
  updated_at: string;
}): SessionRecord {
  return {
    uuid: row.uuid,
    title: row.title,
    programUuid: row.program_uuid,
    masterUuid: row.master_uuid,
    daysOfWeek: row.days_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    venue: row.venue,
    maxCapacity: row.max_capacity,
    isApprovedPublic: Boolean(row.is_approved_public),
    status: row.status,
    revision: row.revision,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
