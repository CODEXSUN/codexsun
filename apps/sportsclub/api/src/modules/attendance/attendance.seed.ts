import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { AttendanceRepository } from "./attendance.repository.js";

export async function seedAttendanceModule(db: Kysely<SportsclubDatabase>) {
  const repository = new AttendanceRepository(db);
  const existing = await repository.bySession("c0010001", "2026-10-18");
  if (existing.length === 0) {
    await repository.record(
      {
        sessionUuid: "c0010001",
        memberUuid: "d0010001",
        attendanceDate: "2026-10-18",
        status: "present",
        remarks: "Punctual. Excellent stance work."
      },
      "veerapandian@tenkasisports.test"
    );
  }
}
