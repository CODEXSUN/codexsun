import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type MemoryTransport = "sqlite" | "json" | "mariadb";
export type MemoryState = { scope: "task" | "project"; scopeId: string; value: Record<string, unknown>; updatedAt: string };
export type MemoryDecision = { id: string; projectId: string; decision: string; rationale?: string; createdAt: string };

type MemoryRecord = { id: string; ownerId: string; scope: "task" | "project" | "decision"; scopeId: string; key: string; value: Record<string, unknown>; createdAt: string; updatedAt: string };
type JsonFile = { version: 1; records: MemoryRecord[] };

export class MemoryToolError extends Error {
  constructor(readonly statusCode: 400 | 501, message: string) { super(message); this.name = "MemoryToolError"; }
}

export class MemoryTools {
  private readonly database?: DatabaseSync;
  private readonly jsonPath?: string;
  private json: JsonFile = { version: 1, records: [] };

  constructor(private readonly transport: MemoryTransport, location: string) {
    if (transport === "sqlite") {
      if (!existsSync(location)) mkdirSync(dirname(location), { recursive: true });
      this.database = new DatabaseSync(location);
      this.database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
      this.database.exec("CREATE TABLE IF NOT EXISTS codeloop_memory_records (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, scope TEXT NOT NULL, scope_id TEXT NOT NULL, key TEXT NOT NULL, value_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(owner_id, scope, scope_id, key)); CREATE INDEX IF NOT EXISTS idx_codeloop_memory_scope ON codeloop_memory_records(owner_id, scope, scope_id, updated_at DESC);");
    } else if (transport === "json") {
      this.jsonPath = location;
      this.loadJson();
    }
  }

  capabilities() {
    return { transport: this.transport, phases: { sqlite: "active", json: "available", mariadb: "planned" }, tools: ["memory.task_state", "memory.project_state", "memory.decisions"] as const };
  }

  taskState(ownerId: string, taskId: string, value?: Record<string, unknown>): MemoryState | null {
    return this.state(ownerId, "task", taskId, value);
  }

  projectState(ownerId: string, projectId: string, value?: Record<string, unknown>): MemoryState | null {
    return this.state(ownerId, "project", projectId, value);
  }

  decisions(ownerId: string, projectId: string, decision?: { decision: string; rationale?: string }): readonly MemoryDecision[] {
    if (this.transport === "mariadb") this.mariadbError();
    if (decision) {
      const now = new Date().toISOString();
      const record: MemoryRecord = { id: `decision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ownerId, scope: "decision", scopeId: projectId, key: now, value: { decision: decision.decision, ...(decision.rationale ? { rationale: decision.rationale } : {}) }, createdAt: now, updatedAt: now };
      this.writeRecord(record);
    }
    return this.records(ownerId, "decision", projectId).map((record) => ({ id: record.id, projectId, decision: String(record.value.decision ?? ""), rationale: typeof record.value.rationale === "string" ? record.value.rationale : undefined, createdAt: record.createdAt }));
  }

  close(): void { this.database?.close(); }

  private state(ownerId: string, scope: "task" | "project", scopeId: string, value?: Record<string, unknown>): MemoryState | null {
    if (this.transport === "mariadb") this.mariadbError();
    const existing = this.records(ownerId, scope, scopeId)[0];
    if (value === undefined) return existing ? { scope, scopeId, value: existing.value, updatedAt: existing.updatedAt } : null;
    const now = new Date().toISOString();
    const record: MemoryRecord = existing
      ? { ...existing, value, updatedAt: now }
      : { id: `${scope}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ownerId, scope, scopeId, key: "state", value, createdAt: now, updatedAt: now };
    this.writeRecord(record);
    return { scope, scopeId, value, updatedAt: now };
  }

  private records(ownerId: string, scope: MemoryRecord["scope"], scopeId: string): MemoryRecord[] {
    if (this.transport === "sqlite") {
      const rows = this.database!.prepare("SELECT id, owner_id, scope, scope_id, key, value_json, created_at, updated_at FROM codeloop_memory_records WHERE owner_id = ? AND scope = ? AND scope_id = ? ORDER BY created_at ASC").all(ownerId, scope, scopeId) as Record<string, string>[];
      return rows.map(mapRow);
    }
    return this.json.records.filter((record) => record.ownerId === ownerId && record.scope === scope && record.scopeId === scopeId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  private writeRecord(record: MemoryRecord): void {
    if (this.transport === "sqlite") {
      this.database!.prepare("INSERT INTO codeloop_memory_records (id, owner_id, scope, scope_id, key, value_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(owner_id, scope, scope_id, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at").run(record.id, record.ownerId, record.scope, record.scopeId, record.key, JSON.stringify(record.value), record.createdAt, record.updatedAt);
      return;
    }
    const index = this.json.records.findIndex((item) => item.ownerId === record.ownerId && item.scope === record.scope && item.scopeId === record.scopeId && item.key === record.key);
    if (index >= 0) this.json.records[index] = record;
    else this.json.records.push(record);
    this.persistJson();
  }

  private loadJson(): void {
    try { this.json = JSON.parse(readFileSync(this.jsonPath!, "utf8")) as JsonFile; } catch { this.json = { version: 1, records: [] }; }
  }

  private persistJson(): void { mkdirSync(dirname(this.jsonPath!), { recursive: true }); writeFileSync(this.jsonPath!, JSON.stringify(this.json, null, 2), "utf8"); }
  private mariadbError(): never { throw new MemoryToolError(501, "MariaDB memory transport is reserved for a later deployment phase."); }
}

function mapRow(row: Record<string, string>): MemoryRecord { return { id: row.id, ownerId: row.owner_id, scope: row.scope as MemoryRecord["scope"], scopeId: row.scope_id, key: row.key, value: JSON.parse(row.value_json) as Record<string, unknown>, createdAt: row.created_at, updatedAt: row.updated_at }; }
