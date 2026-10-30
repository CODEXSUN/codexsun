import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import type { AttendanceListQuery, AttendancePayload, AttendanceRecord } from "./attendance.types.js";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
  type ListResponse
} from "../../sportsclub.pagination.js";

export class AttendanceRepository {
  constructor(private readonly db: Kysely<SportsclubDatabase>) {}

  async list(query?: AttendanceListQuery): Promise<ListResponse<AttendanceRecord>> {
    const page = typeof query?.page === "number" ? query.page : Number(query?.page ?? 1) || 1;
    const pageSize = DEFAULT_PAGE_SIZE;
    const search = query?.search?.trim();
    const targetDate = query?.attendanceDate ?? query?.sessionDate;

    let baseQuery = this.db.selectFrom("sportsclub_attendance");

    if (query?.sessionUuid) {
      baseQuery = baseQuery.where("session_uuid", "=", query.sessionUuid);
    }
    if (query?.memberUuid) {
      baseQuery = baseQuery.where("member_uuid", "=", query.memberUuid);
    }
    if (targetDate) {
      baseQuery = baseQuery.where("attendance_date", "=", targetDate);
    }
    if (query?.status) {
      baseQuery = baseQuery.where("status", "=", query.status);
    }
    if (search) {
      const term = `%${search.toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("remarks", "like", term),
          eb("recorded_by", "like", term)
        ])
      );
    }

    const countResult = await baseQuery
      .select((eb) => eb.fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQuery
      .selectAll()
      .orderBy("attendance_date", "desc")
      .orderBy("id", "desc")
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

  async find(uuid: string): Promise<AttendanceRecord | undefined> {
    const row = await this.db
      .selectFrom("sportsclub_attendance")
      .selectAll()
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    return row ? toRecord(row) : undefined;
  }

  async byMember(memberUuid: string): Promise<AttendanceRecord[]> {
    const rows = await this.db
      .selectFrom("sportsclub_attendance")
      .selectAll()
      .where("member_uuid", "=", memberUuid)
      .orderBy("attendance_date", "desc")
      .execute();
    return rows.map(toRecord);
  }

  async bySession(sessionUuid: string, date?: string): Promise<AttendanceRecord[]> {
    let query = this.db
      .selectFrom("sportsclub_attendance")
      .selectAll()
      .where("session_uuid", "=", sessionUuid);

    if (date) {
      query = query.where("attendance_date", "=", date);
    }

    const rows = await query.orderBy("attendance_date", "desc").execute();
    return rows.map(toRecord);
  }

  async record(value: AttendancePayload, recordedBy: string): Promise<AttendanceRecord> {
    const key = randomBytes(4).toString("hex");
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const existing = await this.db
      .selectFrom("sportsclub_attendance")
      .selectAll()
      .where("session_uuid", "=", value.sessionUuid)
      .where("member_uuid", "=", value.memberUuid)
      .where("attendance_date", "=", value.attendanceDate)
      .executeTakeFirst();

    if (existing) {
      await this.db
        .updateTable("sportsclub_attendance")
        .set({
          status: value.status,
          remarks: value.remarks.trim(),
          recorded_by: recordedBy,
          updated_at: now
        })
        .where("id", "=", existing.id)
        .execute();
      return (await this.find(existing.uuid))!;
    }

    await this.db
      .insertInto("sportsclub_attendance")
      .values({
        uuid: key,
        session_uuid: value.sessionUuid,
        member_uuid: value.memberUuid,
        attendance_date: value.attendanceDate,
        status: value.status,
        remarks: value.remarks.trim(),
        recorded_by: recordedBy,
        created_at: now,
        updated_at: now
      })
      .execute();

    return (await this.find(key))!;
  }

  async update(uuid: string, value: AttendancePayload, recordedBy: string): Promise<AttendanceRecord> {
    const duplicate = await this.db
      .selectFrom("sportsclub_attendance")
      .select("uuid")
      .where("session_uuid", "=", value.sessionUuid)
      .where("member_uuid", "=", value.memberUuid)
      .where("attendance_date", "=", value.attendanceDate)
      .where("uuid", "!=", uuid)
      .executeTakeFirst();
    if (duplicate) {
      throw AppError.conflict("Attendance already exists for this member, session, and date.");
    }
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const result = await this.db
      .updateTable("sportsclub_attendance")
      .set({
        session_uuid: value.sessionUuid,
        member_uuid: value.memberUuid,
        attendance_date: value.attendanceDate,
        status: value.status,
        remarks: value.remarks.trim(),
        recorded_by: recordedBy,
        updated_at: now
      })
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    if (!Number(result.numUpdatedRows)) {
      throw AppError.notFound("Attendance record not found.");
    }
    return (await this.find(uuid))!;
  }

  async forceDelete(uuid: string): Promise<void> {
    const result = await this.db
      .deleteFrom("sportsclub_attendance")
      .where("uuid", "=", uuid)
      .executeTakeFirst();
    if (!Number(result.numDeletedRows)) {
      throw AppError.notFound("Attendance record not found.");
    }
  }
}

function toRecord(row: {
  uuid: string;
  session_uuid: string;
  member_uuid: string;
  attendance_date: string;
  status: "present" | "absent" | "excused" | "late";
  remarks: string;
  recorded_by: string;
  created_at: string;
  updated_at: string;
}): AttendanceRecord {
  return {
    uuid: row.uuid,
    sessionUuid: row.session_uuid,
    memberUuid: row.member_uuid,
    attendanceDate: row.attendance_date,
    status: row.status,
    remarks: row.remarks,
    recordedBy: row.recorded_by,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
