import { sql, type Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { isSqliteDatabase } from "../../sportsclub.dialect.js";

export async function migrateAttendanceModule(db: Kysely<SportsclubDatabase>) {
  if (isSqliteDatabase(db)) {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      session_uuid TEXT NOT NULL REFERENCES sportsclub_sessions(uuid),
      member_uuid TEXT NOT NULL REFERENCES sportsclub_members(uuid),
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL,
      remarks TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(session_uuid, member_uuid, attendance_date)
    )`).execute(db);
  } else {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_attendance (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(8) NOT NULL UNIQUE,
      session_uuid VARCHAR(8) NOT NULL,
      member_uuid VARCHAR(8) NOT NULL,
      attendance_date VARCHAR(10) NOT NULL,
      status VARCHAR(24) NOT NULL,
      remarks VARCHAR(500) NOT NULL DEFAULT '',
      recorded_by VARCHAR(254) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_attendance (session_uuid, member_uuid, attendance_date),
      INDEX idx_attendance_member (member_uuid),
      FOREIGN KEY (session_uuid) REFERENCES sportsclub_sessions(uuid) ON DELETE RESTRICT,
      FOREIGN KEY (member_uuid) REFERENCES sportsclub_members(uuid) ON DELETE RESTRICT
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(db);
  }
}
