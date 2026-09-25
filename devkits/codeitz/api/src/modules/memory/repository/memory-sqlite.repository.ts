import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  MemoryEntry,
  QueryMemoriesInput,
} from "../contracts/memory-contracts.js";

export class MemorySqliteRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath: string = ":memory:") {
    if (dbPath !== ":memory:") {
      const dir = dirname(dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
    this.db = new DatabaseSync(dbPath);
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS memory_bank_sections (
        project_id TEXT NOT NULL,
        section TEXT NOT NULL,
        content TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (project_id, section)
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL,
        importance INTEGER DEFAULT 5,
        source TEXT DEFAULT 'system',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project_id);
      CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
      CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
    `);
  }

  saveSection(projectId: string, section: string, content: string): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO memory_bank_sections (project_id, section, content, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(project_id, section) DO UPDATE SET
        content = excluded.content,
        updated_at = excluded.updated_at
    `);
    stmt.run(projectId, section, content, now);
  }

  getSection(projectId: string, section: string): string | null {
    const stmt = this.db.prepare(`
      SELECT content FROM memory_bank_sections
      WHERE project_id = ? AND section = ?
    `);
    const row = stmt.get(projectId, section) as { content: string } | undefined;
    return row ? row.content : null;
  }

  getAllSections(projectId: string): Record<string, string> {
    const stmt = this.db.prepare(`
      SELECT section, content FROM memory_bank_sections
      WHERE project_id = ?
    `);
    const rows = stmt.all(projectId) as Array<{ section: string; content: string }>;
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.section] = row.content;
    }
    return result;
  }

  saveMemory(entry: MemoryEntry): void {
    const stmt = this.db.prepare(`
      INSERT INTO memories (id, project_id, category, key, content, tags, importance, source, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        project_id = excluded.project_id,
        category = excluded.category,
        key = excluded.key,
        content = excluded.content,
        tags = excluded.tags,
        importance = excluded.importance,
        source = excluded.source,
        updated_at = excluded.updated_at
    `);
    stmt.run(
      entry.id,
      entry.projectId,
      entry.category,
      entry.key,
      entry.content,
      JSON.stringify(entry.tags),
      entry.importance,
      entry.source,
      entry.createdAt,
      entry.updatedAt,
    );
  }

  findMemoryById(id: string): MemoryEntry | null {
    const stmt = this.db.prepare(`
      SELECT id, project_id, category, key, content, tags, importance, source, created_at, updated_at
      FROM memories WHERE id = ?
    `);
    const row = stmt.get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.mapRowToMemory(row);
  }

  queryMemories(filter: QueryMemoriesInput): MemoryEntry[] {
    let sql = `SELECT id, project_id, category, key, content, tags, importance, source, created_at, updated_at FROM memories WHERE 1=1`;
    const params: Array<string | number> = [];

    if (filter.projectId) {
      sql += ` AND project_id = ?`;
      params.push(filter.projectId);
    }
    if (filter.category) {
      sql += ` AND category = ?`;
      params.push(filter.category);
    }
    if (filter.minImportance !== undefined) {
      sql += ` AND importance >= ?`;
      params.push(filter.minImportance);
    }
    if (filter.search) {
      sql += ` AND (key LIKE ? OR content LIKE ? OR tags LIKE ?)`;
      const term = `%${filter.search}%`;
      params.push(term, term, term);
    }
    if (filter.tag) {
      sql += ` AND tags LIKE ?`;
      params.push(`%"${filter.tag}"%`);
    }

    sql += ` ORDER BY importance DESC, updated_at DESC LIMIT ?`;
    params.push(filter.limit ?? 50);

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as Array<Record<string, unknown>>;
    return rows.map((r) => this.mapRowToMemory(r));
  }

  deleteMemory(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM memories WHERE id = ?`);
    const res = stmt.run(id);
    return (res.changes ?? 0) > 0;
  }

  countMemories(projectId?: string): number {
    if (projectId) {
      const stmt = this.db.prepare(`SELECT count(*) as cnt FROM memories WHERE project_id = ?`);
      const row = stmt.get(projectId) as { cnt: number };
      return row.cnt;
    }
    const stmt = this.db.prepare(`SELECT count(*) as cnt FROM memories`);
    const row = stmt.get() as { cnt: number };
    return row.cnt;
  }

  close(): void {
    this.db.close();
  }

  private mapRowToMemory(row: Record<string, unknown>): MemoryEntry {
    let tags: string[] = [];
    try {
      tags = JSON.parse(String(row.tags));
    } catch {
      tags = [];
    }

    return {
      id: String(row.id),
      projectId: String(row.project_id),
      category: row.category as MemoryEntry["category"],
      key: String(row.key),
      content: String(row.content),
      tags,
      importance: Number(row.importance),
      source: row.source as MemoryEntry["source"],
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }
}
