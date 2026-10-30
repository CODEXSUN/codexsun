import { sql, type Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { isSqliteDatabase } from "../../sportsclub.dialect.js";

export async function migrateProgramModule(db: Kysely<SportsclubDatabase>) {
  if (isSqliteDatabase(db)) {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      discipline TEXT NOT NULL,
      description TEXT NOT NULL,
      level TEXT NOT NULL,
      age_group TEXT NOT NULL,
      is_approved_public INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      sort_order INTEGER NOT NULL DEFAULT 0,
      revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).execute(db);
  } else {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_programs (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(8) NOT NULL UNIQUE,
      code VARCHAR(32) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      discipline VARCHAR(120) NOT NULL,
      description TEXT NOT NULL,
      level VARCHAR(24) NOT NULL DEFAULT 'all_levels',
      age_group VARCHAR(80) NOT NULL DEFAULT '',
      is_approved_public TINYINT(1) NOT NULL DEFAULT 1,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      revision INT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sportsclub_programs_public (status, is_approved_public)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(db);
  }
}
