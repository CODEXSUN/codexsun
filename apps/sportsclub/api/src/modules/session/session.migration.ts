import { sql, type Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { isSqliteDatabase } from "../../sportsclub.dialect.js";

export async function migrateSessionModule(db: Kysely<SportsclubDatabase>) {
  if (isSqliteDatabase(db)) {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      program_uuid TEXT NOT NULL REFERENCES sportsclub_programs(uuid),
      master_uuid TEXT NULL REFERENCES sportsclub_masters(uuid),
      days_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      max_capacity INTEGER NOT NULL DEFAULT 30,
      is_approved_public INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).execute(db);
  } else {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_sessions (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(8) NOT NULL UNIQUE,
      title VARCHAR(160) NOT NULL,
      program_uuid VARCHAR(8) NOT NULL,
      master_uuid VARCHAR(8) NULL,
      days_of_week VARCHAR(64) NOT NULL,
      start_time VARCHAR(8) NOT NULL,
      end_time VARCHAR(8) NOT NULL,
      venue VARCHAR(160) NOT NULL,
      max_capacity INT NOT NULL DEFAULT 30,
      is_approved_public TINYINT(1) NOT NULL DEFAULT 1,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      revision INT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sportsclub_sessions_public (status, is_approved_public),
      FOREIGN KEY (program_uuid) REFERENCES sportsclub_programs(uuid) ON DELETE RESTRICT,
      FOREIGN KEY (master_uuid) REFERENCES sportsclub_masters(uuid) ON DELETE RESTRICT
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(db);
  }
}
