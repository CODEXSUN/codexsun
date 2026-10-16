import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import { sql, type Kysely, type Transaction } from "kysely";
import type {
  AttendanceDatabase,
  AttendanceFilters,
  AttendanceInput,
  AttendanceStatus
} from "./attendance.types.js";

export class AttendanceRepository {
  constructor(private readonly database: Kysely<AttendanceDatabase>) {}

  async today() {
    const result = await sql<{ today: string }>`
      SELECT DATE_FORMAT(CURRENT_DATE(), '%Y-%m-%d') today
    `.execute(this.database);
    return result.rows[0]!.today;
  }

  async list(filters: AttendanceFilters) {
    let query = recordQuery(this.database).where("a.deleted_at", "is", null);
    if (filters.date) query = query.where("a.work_date", "=", filters.date);
    if (filters.status && filters.status !== "all")
      query = query.where("a.status", "=", filters.status);
    if (filters.search) {
      const term = `%${filters.search.replace(/[\\%_]/g, "\\$&")}%`;
      query = query.where((eb) =>
        eb.or([
          eb("e.employee_code", "like", term),
          eb("e.name", "like", term),
          eb("e.department", "like", term)
        ])
      );
    }
    return (await query.orderBy("a.work_date", "desc").orderBy("e.name").execute()).map(toRecord);
  }

  async get(id: string) {
    const row = await recordQuery(this.database).where("a.uuid", "=", id).executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  async employeeOptions() {
    return this.database
      .selectFrom("hrms_employees")
      .select(["uuid as id", "employee_code as employeeCode", "name", "department"])
      .where("status", "=", "active")
      .where("deleted_at", "is", null)
      .orderBy("name")
      .execute();
  }

  async employee(id: string) {
    return this.database
      .selectFrom("hrms_employees")
      .select([
        "uuid as id",
        "employee_code as employeeCode",
        "name",
        "status",
        "deleted_at as deletedAt"
      ])
      .where("uuid", "=", id)
      .executeTakeFirst();
  }

  async duplicate(employeeId: string, workDate: string, excluding?: string) {
    let query = this.database
      .selectFrom("hrms_attendance")
      .select("uuid")
      .where("employee_uuid", "=", employeeId)
      .where("work_date", "=", workDate);
    if (excluding) query = query.where("uuid", "!=", excluding);
    return query.executeTakeFirst();
  }

  create(input: AttendanceInput, actor: string) {
    const id = randomBytes(4).toString("hex");
    return this.database.transaction().execute(async (database) => {
      await database
        .insertInto("hrms_attendance")
        .values({ uuid: id, ...toRow(input) })
        .execute();
      await activity(
        database,
        id,
        "created",
        actor,
        `${input.workDate}: ${input.status} recorded.`
      );
      return id;
    });
  }

  update(id: string, input: AttendanceInput, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockAttendance(database, id, false);
      await database
        .updateTable("hrms_attendance")
        .set(toRow(input))
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(database, id, "updated", actor, `${input.workDate}: ${input.status} updated.`);
    });
  }

  remove(id: string, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockAttendance(database, id, false);
      await database
        .updateTable("hrms_attendance")
        .set({ deleted_at: sql<string>`CURRENT_TIMESTAMP` })
        .where("uuid", "=", id)
        .where("deleted_at", "is", null)
        .execute();
      await activity(database, id, "deleted", actor, "Attendance record was removed.");
    });
  }

  restore(id: string, actor: string) {
    return this.database.transaction().execute(async (database) => {
      await lockAttendance(database, id, true);
      await database
        .updateTable("hrms_attendance")
        .set({ deleted_at: null })
        .where("uuid", "=", id)
        .where("deleted_at", "is not", null)
        .execute();
      await activity(database, id, "restored", actor, "Attendance record was restored.");
    });
  }

  async overview(today: string, weekStart: string) {
    const totals = await sql<{
      activeEmployees: number | string;
      markedToday: number | string;
      presentToday: number | string;
      absentToday: number | string;
      leaveToday: number | string;
      holidayToday: number | string;
    }>`SELECT
      (SELECT COUNT(*) FROM hrms_employees WHERE status='active' AND deleted_at IS NULL) activeEmployees,
      COUNT(DISTINCT employee_uuid) markedToday,
      SUM(status='present') presentToday,
      SUM(status='absent') absentToday,
      SUM(status='leave') leaveToday,
      SUM(status='holiday') holidayToday
      FROM hrms_attendance WHERE work_date=${today} AND deleted_at IS NULL`.execute(this.database);
    const week = await sql<{
      workDate: string;
      status: AttendanceStatus;
      total: number | string;
    }>`SELECT DATE_FORMAT(work_date,'%Y-%m-%d') workDate,status,COUNT(*) total
      FROM hrms_attendance WHERE work_date BETWEEN ${weekStart} AND ${today} AND deleted_at IS NULL
      GROUP BY work_date,status ORDER BY work_date`.execute(this.database);
    const recent = await recordQuery(this.database)
      .where("a.deleted_at", "is", null)
      .orderBy("a.work_date", "desc")
      .orderBy("a.updated_at", "desc")
      .limit(8)
      .execute();
    const row = totals.rows[0]!;
    const activeEmployees = Number(row.activeEmployees);
    const markedToday = Number(row.markedToday);
    const presentToday = Number(row.presentToday ?? 0);
    const days = new Map<string, Record<AttendanceStatus, number>>();
    for (const item of week.rows) {
      const counts = days.get(item.workDate) ?? { present: 0, absent: 0, leave: 0, holiday: 0 };
      counts[item.status] = Number(item.total);
      days.set(item.workDate, counts);
    }
    for (let offset = 0; offset < 7; offset++) {
      const date = addDays(weekStart, offset);
      if (date <= today && !days.has(date))
        days.set(date, { present: 0, absent: 0, leave: 0, holiday: 0 });
    }
    return {
      activeEmployees,
      markedToday,
      presentToday,
      absentToday: Number(row.absentToday ?? 0),
      leaveToday: Number(row.leaveToday ?? 0),
      holidayToday: Number(row.holidayToday ?? 0),
      notMarkedToday: Math.max(0, activeEmployees - markedToday),
      attendanceRate: activeEmployees ? Math.round((presentToday / activeEmployees) * 100) : 0,
      today,
      week: [...days.entries()].map(([date, counts]) => ({ date, ...counts })),
      recent: recent.map((item) => {
        const entry = toRecord(item);
        return {
          id: entry.id,
          employeeCode: entry.employeeCode,
          employeeName: entry.employeeName,
          workDate: entry.workDate,
          status: entry.status,
          checkIn: entry.checkIn,
          checkOut: entry.checkOut
        };
      })
    };
  }

  async overviewToday() {
    const today = await this.today();
    return this.overview(today, addDays(today, -6));
  }
}

function recordQuery(database: Kysely<AttendanceDatabase>) {
  return database
    .selectFrom("hrms_attendance as a")
    .innerJoin("hrms_employees as e", "e.uuid", "a.employee_uuid")
    .select([
      "a.uuid as id",
      "a.employee_uuid as employeeId",
      "e.employee_code as employeeCode",
      "e.name as employeeName",
      "e.department",
      sql<string>`DATE_FORMAT(a.work_date,'%Y-%m-%d')`.as("workDate"),
      "a.status",
      "a.check_in as checkIn",
      "a.check_out as checkOut",
      "a.notes",
      "a.deleted_at as deletedAt",
      "a.created_at as createdAt",
      "a.updated_at as updatedAt"
    ]);
}

function toRecord(
  row: Awaited<ReturnType<ReturnType<typeof recordQuery>["executeTakeFirstOrThrow"]>>
) {
  return {
    ...row,
    checkIn: row.checkIn || null,
    checkOut: row.checkOut || null,
    deletedAt: iso(row.deletedAt),
    createdAt: iso(row.createdAt)!,
    updatedAt: iso(row.updatedAt)!
  };
}

function toRow(input: AttendanceInput) {
  return {
    employee_uuid: input.employeeId,
    work_date: input.workDate,
    status: input.status,
    check_in: input.checkIn,
    check_out: input.checkOut,
    notes: input.notes
  };
}

async function lockAttendance(
  database: Transaction<AttendanceDatabase>,
  id: string,
  deleted: boolean
) {
  const row = await database
    .selectFrom("hrms_attendance")
    .select("deleted_at")
    .where("uuid", "=", id)
    .forUpdate()
    .executeTakeFirst();
  if (!row) throw AppError.notFound("Attendance record was not found.");
  if (Boolean(row.deleted_at) !== deleted)
    throw AppError.conflict("Attendance record changed. Refresh and try again.");
}

function activity(
  database: Transaction<AttendanceDatabase>,
  id: string,
  action: string,
  actor: string,
  summary: string
) {
  return database
    .insertInto("hrms_attendance_activity")
    .values({
      uuid: randomBytes(4).toString("hex"),
      attendance_uuid: id,
      action,
      actor_email: actor,
      summary
    })
    .execute();
}

function iso(value: Date | string | null) {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  const normalized = value.replace(" ", "T");
  return new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`).toISOString();
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
