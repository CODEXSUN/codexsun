import type { DatabaseSync } from "node:sqlite";
export function applyGarmentsIndexMigration(database: DatabaseSync): void {
  database.exec(
    "CREATE TABLE IF NOT EXISTS garments_documents (path TEXT PRIMARY KEY, extension TEXT NOT NULL, content TEXT NOT NULL, checksum TEXT NOT NULL, source_mtime_ms INTEGER NOT NULL, source_size INTEGER NOT NULL, indexed_at TEXT NOT NULL);",
  );
}
