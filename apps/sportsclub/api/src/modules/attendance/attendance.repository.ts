import { randomBytes } from "node:crypto";
import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import type { AttendancePayload, AttendanceRecord } from "./attendance.types.js";

export class AttendanceRepository {
  constructor(private readonly db: Kysely<SportsclubDatabase>) {}

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
