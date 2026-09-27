import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type ProjectKnowledgeRecord = { id: string; ownerId: string; projectId: string; name: string; path: string; size: string; description: string; createdAt: string };

export class ProjectKnowledgeStore {
  private readonly database: DatabaseSync;
  constructor(databasePath: string) { if (!existsSync(databasePath)) mkdirSync(dirname(databasePath), { recursive: true }); this.database = new DatabaseSync(databasePath); this.database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;"); }
  initialize(): void { this.database.exec("CREATE TABLE IF NOT EXISTS codeloop_project_knowledge (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, project_id TEXT NOT NULL, name TEXT NOT NULL, path TEXT NOT NULL, size TEXT NOT NULL, description TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(owner_id, project_id, path)); CREATE INDEX IF NOT EXISTS idx_codeloop_knowledge_owner_project ON codeloop_project_knowledge(owner_id, project_id);"); }
  list(ownerId: string, projectId: string): readonly ProjectKnowledgeRecord[] { const rows = this.database.prepare("SELECT id, owner_id, project_id, name, path, size, description, created_at FROM codeloop_project_knowledge WHERE owner_id = ? AND project_id = ? ORDER BY name ASC").all(ownerId, projectId) as Record<string, string>[]; return rows.map(mapRow); }
  replace(ownerId: string, projectId: string, files: readonly Omit<ProjectKnowledgeRecord, "id" | "ownerId" | "projectId" | "createdAt">[]): readonly ProjectKnowledgeRecord[] { this.database.exec("BEGIN IMMEDIATE"); try { this.database.prepare("DELETE FROM codeloop_project_knowledge WHERE owner_id = ? AND project_id = ?").run(ownerId, projectId); const now = new Date().toISOString(); for (const file of files) this.database.prepare("INSERT INTO codeloop_project_knowledge (id, owner_id, project_id, name, path, size, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(`knowledge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ownerId, projectId, file.name, file.path, file.size, file.description, now); this.database.exec("COMMIT"); return this.list(ownerId, projectId); } catch (error) { this.database.exec("ROLLBACK"); throw error; } }
  close(): void { this.database.close(); }
}

function mapRow(row: Record<string, string>): ProjectKnowledgeRecord { return { id: row.id, ownerId: row.owner_id, projectId: row.project_id, name: row.name, path: row.path, size: row.size, description: row.description, createdAt: row.created_at }; }
