import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import { sql, type Kysely } from "kysely";

type NotesDatabase = Record<string, Record<string, unknown>>;

export const notesMigration = {
  key: "notes.001_foundation",
  moduleKey: "notes"
} as const;

export const notesMigrationBatch: MigrationBatch<NotesDatabase> = {
  batch: 1,
  description: "Notes module-owned schema baseline through release 1.0.91.",
  scope: "notes",
  steps: [
    {
      checksum: `${notesMigration.key}:v1`,
      description: "Company-scoped team notes with lifecycle status.",
      name: notesMigration.key,
      up: applyNotesSchema,
      version: 1
    }
  ],
  version: "1.0.91"
};

export async function migrateNotesModule(database: Kysely<NotesDatabase>) {
  await runMigrationBatch(database, notesMigrationBatch, { batchSize: 1 });
}

export async function rollbackNotesModule(database: Kysely<NotesDatabase>) {
  void database;
  throw new Error("Notes rollback requires a reviewed, data-preserving migration plan.");
}

async function applyNotesSchema(database: Kysely<NotesDatabase>) {
  await sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS notes_notes (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      company_id INT NOT NULL DEFAULT 0,
      title VARCHAR(240) NOT NULL,
      body LONGTEXT NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      created_by VARCHAR(191) NOT NULL,
      updated_by VARCHAR(191) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX notes_notes_company_idx (company_id, status, updated_at)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);
}
