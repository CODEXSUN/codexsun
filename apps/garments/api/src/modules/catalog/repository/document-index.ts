import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applyGarmentsIndexMigration } from "../migrations/garments-index.migration.js";
import type { DiscoveredDocument } from "../service/document-source.js";
export interface IndexSyncResult {
  readonly changed: number;
  readonly discovered: number;
  readonly removed: number;
  readonly unchanged: number;
}

interface IndexedDocument {
  readonly path: string;
  readonly source_mtime_ms: number;
  readonly source_size: number;
}

export class DocumentIndex {
  private readonly database: DatabaseSync;
  constructor(indexPath: string) {
    mkdirSync(dirname(indexPath), { recursive: true });
    this.database = new DatabaseSync(indexPath);
    applyGarmentsIndexMigration(this.database);
  }
  sync(documents: readonly DiscoveredDocument[]): IndexSyncResult {
    const existing = new Map<string, IndexedDocument>(
      this.database
        .prepare("SELECT path, source_mtime_ms, source_size FROM garments_documents")
        .all()
        .map((row) => {
          const document = row as unknown as IndexedDocument;
          return [document.path, document] as const;
        }),
    );
    let changed = 0;
    let unchanged = 0;
    for (const document of documents) {
      const stored = existing.get(document.path);
      if (stored && stored.source_mtime_ms === document.sourceMtimeMs && stored.source_size === document.sourceSize)
        unchanged++;
      else {
        this.database
          .prepare(
            "INSERT INTO garments_documents (path, extension, content, checksum, source_mtime_ms, source_size, indexed_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(path) DO UPDATE SET extension=excluded.extension, content=excluded.content, checksum=excluded.checksum, source_mtime_ms=excluded.source_mtime_ms, source_size=excluded.source_size, indexed_at=excluded.indexed_at",
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
    for (const path of existing.keys()) this.database.prepare("DELETE FROM garments_documents WHERE path = ?").run(path);
    return { changed, discovered: documents.length, removed: existing.size, unchanged };
  }
  close(): void {
    this.database.close();
  }
}
