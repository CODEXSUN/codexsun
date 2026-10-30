import { sql, type Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { isSqliteDatabase } from "../../sportsclub.dialect.js";

export async function migrateMemberModule(db: Kysely<SportsclubDatabase>) {
  if (isSqliteDatabase(db)) {
    await sql
      .raw(
        `CREATE TABLE IF NOT EXISTS sportsclub_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      date_of_birth TEXT NULL,
      gender TEXT NULL,
      guardian_name TEXT NULL,
      guardian_phone TEXT NULL,
      emergency_contact TEXT NULL,
      medical_notes TEXT NOT NULL,
      address TEXT NOT NULL,
      program_uuid TEXT NULL REFERENCES sportsclub_programs(uuid),
      master_uuid TEXT NULL REFERENCES sportsclub_masters(uuid),
      role TEXT NOT NULL DEFAULT 'student',
      status TEXT NOT NULL DEFAULT 'pending',
      progress_note TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
      )
      .execute(db);

    await sql
      .raw(
        `CREATE TABLE IF NOT EXISTS sportsclub_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      entity_type TEXT NOT NULL,
      entity_uuid TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
      )
      .execute(db);
  } else {
    await sql
      .raw(
        `CREATE TABLE IF NOT EXISTS sportsclub_members (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(8) NOT NULL UNIQUE,
      email VARCHAR(254) NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      phone VARCHAR(32) NOT NULL DEFAULT '',
      date_of_birth VARCHAR(16) NULL,
      gender VARCHAR(16) NULL,
      guardian_name VARCHAR(160) NULL,
      guardian_phone VARCHAR(32) NULL,
      emergency_contact VARCHAR(32) NULL,
      medical_notes TEXT NOT NULL,
      address VARCHAR(255) NOT NULL DEFAULT '',
      program_uuid VARCHAR(8) NULL,
      master_uuid VARCHAR(8) NULL,
      role VARCHAR(24) NOT NULL DEFAULT 'student',
      status VARCHAR(24) NOT NULL DEFAULT 'pending',
      progress_note TEXT NOT NULL,
      revision INT NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sportsclub_members_master (master_uuid),
      INDEX idx_sportsclub_members_status (status),
      FOREIGN KEY (program_uuid) REFERENCES sportsclub_programs(uuid) ON DELETE RESTRICT,
      FOREIGN KEY (master_uuid) REFERENCES sportsclub_masters(uuid) ON DELETE RESTRICT
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      )
      .execute(db);

    await sql
      .raw(
        `CREATE TABLE IF NOT EXISTS sportsclub_activity (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(8) NOT NULL UNIQUE,
      entity_type VARCHAR(64) NOT NULL,
      entity_uuid VARCHAR(8) NOT NULL,
      actor VARCHAR(254) NOT NULL,
      action VARCHAR(120) NOT NULL,
      details TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sportsclub_activity_entity (entity_type, entity_uuid)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      )
      .execute(db);
  }
  await migrateMemberPhotoModule(db);
}

export async function migrateMemberPhotoModule(db: Kysely<SportsclubDatabase>) {
  if (isSqliteDatabase(db)) {
    await sql
      .raw(
        `CREATE TABLE IF NOT EXISTS sportsclub_member_photos (
      member_uuid TEXT PRIMARY KEY REFERENCES sportsclub_members(uuid) ON DELETE CASCADE,
      mime_type TEXT NOT NULL,
      content BLOB NOT NULL,
      size_bytes INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
      )
      .execute(db);
    return;
  }
  await sql
    .raw(
      `CREATE TABLE IF NOT EXISTS sportsclub_member_photos (
    member_uuid VARCHAR(8) NOT NULL PRIMARY KEY,
    mime_type VARCHAR(32) NOT NULL,
    content MEDIUMBLOB NOT NULL,
    size_bytes INT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_uuid) REFERENCES sportsclub_members(uuid) ON DELETE CASCADE
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    )
    .execute(db);
}
