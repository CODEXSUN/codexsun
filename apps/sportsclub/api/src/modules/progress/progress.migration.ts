import { sql, type Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { isSqliteDatabase } from "../../sportsclub.dialect.js";

export async function migrateProgressModule(db: Kysely<SportsclubDatabase>) {
  if (isSqliteDatabase(db)) {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      member_uuid TEXT NOT NULL REFERENCES sportsclub_members(uuid),
      master_uuid TEXT NOT NULL REFERENCES sportsclub_masters(uuid),
      program_uuid TEXT NULL REFERENCES sportsclub_programs(uuid),
      stage_level TEXT NOT NULL,
      score INTEGER NULL,
      assessment TEXT NOT NULL,
      private_notes TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      graded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).execute(db);
  } else {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_progress (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(8) NOT NULL UNIQUE,
      member_uuid VARCHAR(8) NOT NULL,
      master_uuid VARCHAR(8) NOT NULL,
      program_uuid VARCHAR(8) NULL,
      stage_level VARCHAR(120) NOT NULL,
      score INT NULL,
      assessment TEXT NOT NULL,
      private_notes TEXT NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'in_progress',
      graded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      revision INT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sportsclub_progress_member (member_uuid),
      INDEX idx_sportsclub_progress_master (master_uuid),
      FOREIGN KEY (member_uuid) REFERENCES sportsclub_members(uuid) ON DELETE RESTRICT,
      FOREIGN KEY (master_uuid) REFERENCES sportsclub_masters(uuid) ON DELETE RESTRICT,
      FOREIGN KEY (program_uuid) REFERENCES sportsclub_programs(uuid) ON DELETE RESTRICT
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(db);
  }
}
