import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applyDocsIndexMigration } from "../migrations/docs-index.migration.js";
import type { DiscoveredDocument } from "../service/document-source.js";
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
    applyDocsIndexMigration(this.database);
  }
  sync(documents: readonly DiscoveredDocument[]): IndexSyncResult {
    const existing = new Map(
      this.database
        .prepare("SELECT path, source_mtime_ms, source_size FROM docs_documents")
        .all()
        .map((row: any) => [row.path, row]),
    );
    let changed = 0;
    let unchanged = 0;
    for (const document of documents) {
      const stored: any = existing.get(document.path);
      if (stored && stored.source_mtime_ms === document.sourceMtimeMs && stored.source_size === document.sourceSize)
        unchanged++;
      else {
        this.database
          .prepare(
            "INSERT INTO docs_documents (path, extension, content, checksum, source_mtime_ms, source_size, indexed_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(path) DO UPDATE SET extension=excluded.extension, content=excluded.content, checksum=excluded.checksum, source_mtime_ms=excluded.source_mtime_ms, source_size=excluded.source_size, indexed_at=excluded.indexed_at",
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
        changed++;
      }
      existing.delete(document.path);
    }
    for (const path of existing.keys()) this.database.prepare("DELETE FROM docs_documents WHERE path = ?").run(path);
    return { changed, discovered: documents.length, removed: existing.size, unchanged };
  }
  close(): void {
    this.database.close();
  }
}
