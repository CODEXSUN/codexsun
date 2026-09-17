import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applyDocsIndexMigration } from "../migrations/docs-index.migration.js";
import type { DiscoveredDocument } from "../service/document-source.js";

export interface IndexedDocument {
  readonly checksum: string;
  readonly path: string;
  readonly sourceMtimeMs: number;
  readonly sourceSize: number;
}

export interface IndexSyncResult {
  readonly changed: number;
  readonly discovered: number;
  readonly removed: number;
  readonly unchanged: number;
}

export class DocumentIndex {
  private readonly database: DatabaseSync;

  constructor(indexPath: string) {
    mkdirSync(dirname(indexPath), { recursive: true });
    this.database = new DatabaseSync(indexPath);
    this.database.exec("PRAGMA foreign_keys = ON");
    this.database.exec("PRAGMA journal_mode = WAL");
    this.database.exec("PRAGMA busy_timeout = 5000");
    applyDocsIndexMigration(this.database);
  }

  sync(documents: readonly DiscoveredDocument[]): IndexSyncResult {
    const existing = new Map(this.documents().map((document) => [document.path, document]));
    let changed = 0;
    let unchanged = 0;
    this.database.exec("BEGIN IMMEDIATE");
    try {
      for (const document of documents) {
        const stored = existing.get(document.path);
        if (stored && isUnchanged(stored, document)) {
          unchanged += 1;
        } else {
          this.upsert(document);
          changed += 1;
        }
        existing.delete(document.path);
      }
      const removed = this.remove([...existing.keys()]);
      this.database.exec("COMMIT");
      return { changed, discovered: documents.length, removed, unchanged };
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  documents(): IndexedDocument[] {
    return this.database
      .prepare("SELECT path, checksum, source_mtime_ms, source_size FROM docs_documents ORDER BY path")
      .all()
      .map((row) => mapDocument(row));
  }

  close(): void {
    this.database.close();
  }

  private upsert(document: DiscoveredDocument): void {
    this.database
      .prepare(
        `INSERT INTO docs_documents (path, extension, content, checksum, source_mtime_ms, source_size, indexed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET extension = excluded.extension, content = excluded.content,
        checksum = excluded.checksum, source_mtime_ms = excluded.source_mtime_ms,
        source_size = excluded.source_size, indexed_at = excluded.indexed_at`,
      )
      .run(
        document.path,
        document.extension,
        document.content,
        createHash("sha256").update(document.content).digest("hex"),
        document.sourceMtimeMs,
        document.sourceSize,
        new Date().toISOString(),
      );
  }

  private remove(paths: readonly string[]): number {
    const statement = this.database.prepare("DELETE FROM docs_documents WHERE path = ?");
    for (const path of paths) statement.run(path);
    return paths.length;
  }
}

function isUnchanged(stored: IndexedDocument, document: DiscoveredDocument): boolean {
  return stored.sourceMtimeMs === document.sourceMtimeMs && stored.sourceSize === document.sourceSize;
}

function mapDocument(row: unknown): IndexedDocument {
  const value = row as Record<string, unknown>;
  return {
    checksum: String(value.checksum),
    path: String(value.path),
    sourceMtimeMs: Number(value.source_mtime_ms),
    sourceSize: Number(value.source_size),
  };
}
