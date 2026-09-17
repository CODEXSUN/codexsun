import type { DatabaseSync } from "node:sqlite";

export const docsIndexMigrationId = "docs-index.001";

export function applyDocsIndexMigration(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS docs_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS docs_documents (
      path TEXT PRIMARY KEY,
      extension TEXT NOT NULL,
      content TEXT NOT NULL,
      checksum TEXT NOT NULL,
      source_mtime_ms INTEGER NOT NULL,
      source_size INTEGER NOT NULL,
      indexed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS docs_documents_extension_idx ON docs_documents(extension);
  `);
  database
    .prepare("INSERT OR IGNORE INTO docs_migrations (id, applied_at) VALUES (?, ?)")
    .run(docsIndexMigrationId, new Date().toISOString());
}
