import { sql, type Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { isSqliteDatabase } from "../../sportsclub.dialect.js";

export async function migrateMasterModule(db: Kysely<SportsclubDatabase>) {
  if (isSqliteDatabase(db)) {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_masters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      title TEXT NOT NULL,
      primary_discipline TEXT NOT NULL,
      public_bio TEXT NOT NULL,
      private_notes TEXT NOT NULL,
      experience_years INTEGER NOT NULL DEFAULT 0,
      is_approved_public INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      sort_order INTEGER NOT NULL DEFAULT 0,
      revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).execute(db);
  } else {
    await sql.raw(`CREATE TABLE IF NOT EXISTS sportsclub_masters (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(8) NOT NULL UNIQUE,
      email VARCHAR(254) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      phone VARCHAR(32) NOT NULL DEFAULT '',
      title VARCHAR(120) NOT NULL,
      primary_discipline VARCHAR(120) NOT NULL,
      public_bio TEXT NOT NULL,
      private_notes TEXT NOT NULL,
      experience_years INT NOT NULL DEFAULT 0,
      is_approved_public TINYINT(1) NOT NULL DEFAULT 1,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      revision INT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sportsclub_masters_public (status, is_approved_public)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).execute(db);
  }
}
