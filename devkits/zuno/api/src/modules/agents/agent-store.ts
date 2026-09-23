import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { AgentRecord, AgentRegistration, AssignmentRecord, CreateAssignment } from "./agent-contracts.js";

export class AgentStore {
  private readonly database: DatabaseSync;

  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.database = new DatabaseSync(path);
    this.database.exec(`PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS zuno_agents (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, api_url TEXT NOT NULL,
        capacity INTEGER NOT NULL, protocol_version INTEGER NOT NULL,
        status TEXT NOT NULL, created_at TEXT NOT NULL, last_seen_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS zuno_agent_assignments (
        id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, cxforge_server_id TEXT NOT NULL,
        title TEXT NOT NULL, prompt TEXT NOT NULL, owned_paths TEXT NOT NULL,
        status TEXT NOT NULL, revision INTEGER NOT NULL, actor_id TEXT NOT NULL,
        result TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );`);
  }

  close(): void { this.database.close(); }

  register(input: AgentRegistration): AgentRecord {
    const now = new Date().toISOString();
    this.database.prepare(`INSERT INTO zuno_agents (id,name,api_url,capacity,protocol_version,status,created_at,last_seen_at)
      VALUES (?,?,?,?,?, 'ready', ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, api_url=excluded.api_url, capacity=excluded.capacity,
      protocol_version=excluded.protocol_version, status='ready', last_seen_at=excluded.last_seen_at`).run(
      input.id, input.name, new URL(input.apiUrl).origin, input.capacity, input.protocolVersion, now, now,
    );
    return this.requiredAgent(input.id);
  }

  agents(): AgentRecord[] {
    return (this.database.prepare("SELECT * FROM zuno_agents ORDER BY name").all() as unknown as AgentRow[]).map(toAgent);
  }

  agent(id: string): AgentRecord | undefined {
    const row = this.database.prepare("SELECT * FROM zuno_agents WHERE id = ?").get(id) as AgentRow | undefined;
    return row ? toAgent(row) : undefined;
  }

  createAssignment(input: CreateAssignment, actorId: string): AssignmentRecord {
    const now = new Date().toISOString();
    const assignment: AssignmentRecord = { ...input, actorId, createdAt: now, id: randomUUID(), result: null, revision: 1, status: "draft", updatedAt: now };
    this.database.prepare(`INSERT INTO zuno_agent_assignments
      (id,agent_id,cxforge_server_id,title,prompt,owned_paths,status,revision,actor_id,result,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      assignment.id, assignment.agentId, assignment.cxforgeServerId, assignment.title, assignment.prompt,
      JSON.stringify(assignment.ownedPaths), assignment.status, assignment.revision, actorId, null, now, now,
    );
    return assignment;
  }

  assignments(): AssignmentRecord[] {
    return (this.database.prepare("SELECT * FROM zuno_agent_assignments ORDER BY created_at DESC").all() as unknown as AssignmentRow[]).map(toAssignment);
  }

  assignment(id: string): AssignmentRecord | undefined {
    const row = this.database.prepare("SELECT * FROM zuno_agent_assignments WHERE id = ?").get(id) as AssignmentRow | undefined;
    return row ? toAssignment(row) : undefined;
  }

  transition(id: string, expected: AssignmentRecord["status"], next: AssignmentRecord["status"], result: string | null = null): AssignmentRecord {
    const updated = this.database.prepare(`UPDATE zuno_agent_assignments
      SET status = ?, revision = revision + 1, result = ?, updated_at = ? WHERE id = ? AND status = ?`).run(next, result, new Date().toISOString(), id, expected);
    if (!updated.changes) throw new Error("Assignment state changed. Refresh before acting.");
    return this.requiredAssignment(id);
  }

  private requiredAgent(id: string): AgentRecord {
    const agent = this.agent(id);
    if (!agent) throw new Error("Agent was not saved.");
    return agent;
  }

  private requiredAssignment(id: string): AssignmentRecord {
    const assignment = this.assignment(id);
    if (!assignment) throw new Error("Assignment was not saved.");
    return assignment;
  }
}

type AgentRow = { id: string; name: string; api_url: string; capacity: number; protocol_version: number; status: AgentRecord["status"]; created_at: string; last_seen_at: string };
type AssignmentRow = { id: string; agent_id: string; cxforge_server_id: string; title: string; prompt: string; owned_paths: string; status: AssignmentRecord["status"]; revision: number; actor_id: string; result: string | null; created_at: string; updated_at: string };

function toAgent(row: AgentRow): AgentRecord {
  return { apiUrl: row.api_url, capacity: row.capacity, createdAt: row.created_at, id: row.id, lastSeenAt: row.last_seen_at, name: row.name, protocolVersion: row.protocol_version, status: row.status };
}

function toAssignment(row: AssignmentRow): AssignmentRecord {
  return { actorId: row.actor_id, agentId: row.agent_id, createdAt: row.created_at, cxforgeServerId: row.cxforge_server_id, id: row.id, ownedPaths: JSON.parse(row.owned_paths) as string[], prompt: row.prompt, result: row.result, revision: row.revision, status: row.status, title: row.title, updatedAt: row.updated_at };
}
