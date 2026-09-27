import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type AgentRunStatus = "running" | "completed" | "failed" | "cancelled";
export type AgentRunEvent = { seq: number; type: string; payload: Record<string, unknown>; createdAt: string };
export type AgentRun = { id: string; ownerId: string; conversationId: string; status: AgentRunStatus; createdAt: string; updatedAt: string; events: readonly AgentRunEvent[] };

type RunRow = { id: string; owner_id: string; conversation_id: string; status: string; created_at: string; updated_at: string };
type EventRow = { seq: number; type: string; payload_json: string; created_at: string };

export class AgentRunStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    if (!existsSync(databasePath)) mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  }

  initialize(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS codeloop_agent_runs (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS codeloop_agent_run_events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_codeloop_agent_runs_active ON codeloop_agent_runs(owner_id, conversation_id, status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_codeloop_agent_run_events_run ON codeloop_agent_run_events(run_id, seq ASC);
    `);
  }

  create(ownerId: string, conversationId: string): AgentRun {
    const now = new Date().toISOString();
    const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.database.prepare("INSERT INTO codeloop_agent_runs (id, owner_id, conversation_id, status, created_at, updated_at) VALUES (?, ?, ?, 'running', ?, ?)").run(id, ownerId, conversationId, now, now);
    return { id, ownerId, conversationId, status: "running", createdAt: now, updatedAt: now, events: [] };
  }

  append(runId: string, type: string, payload: Record<string, unknown>): AgentRunEvent {
    const createdAt = new Date().toISOString();
    const result = this.database.prepare("INSERT INTO codeloop_agent_run_events (run_id, type, payload_json, created_at) VALUES (?, ?, ?, ?)").run(runId, type, JSON.stringify(payload), createdAt);
    this.database.prepare("UPDATE codeloop_agent_runs SET updated_at = ? WHERE id = ?").run(createdAt, runId);
    return { seq: Number(result.lastInsertRowid), type, payload, createdAt };
  }

  finish(runId: string, status: Exclude<AgentRunStatus, "running">): void {
    this.database.prepare("UPDATE codeloop_agent_runs SET status = ?, updated_at = ? WHERE id = ?").run(status, new Date().toISOString(), runId);
  }

  get(ownerId: string, runId: string, afterSeq = 0): AgentRun | null {
    const row = this.database.prepare("SELECT id, owner_id, conversation_id, status, created_at, updated_at FROM codeloop_agent_runs WHERE id = ? AND owner_id = ?").get(runId, ownerId) as RunRow | undefined;
    if (!row) return null;
    return this.map(row, afterSeq);
  }

  active(ownerId: string, conversationId: string): AgentRun | null {
    const row = this.database.prepare("SELECT id, owner_id, conversation_id, status, created_at, updated_at FROM codeloop_agent_runs WHERE owner_id = ? AND conversation_id = ? AND status = 'running' ORDER BY updated_at DESC LIMIT 1").get(ownerId, conversationId) as RunRow | undefined;
    return row ? this.map(row, 0) : null;
  }

  close(): void { this.database.close(); }

  private map(row: RunRow, afterSeq: number): AgentRun {
    const rows = this.database.prepare("SELECT seq, type, payload_json, created_at FROM codeloop_agent_run_events WHERE run_id = ? AND seq > ? ORDER BY seq ASC").all(row.id, afterSeq) as EventRow[];
    return {
      id: row.id,
      ownerId: row.owner_id,
      conversationId: row.conversation_id,
      status: row.status as AgentRunStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      events: rows.map((event) => ({ seq: event.seq, type: event.type, payload: JSON.parse(event.payload_json) as Record<string, unknown>, createdAt: event.created_at })),
    };
  }
}
