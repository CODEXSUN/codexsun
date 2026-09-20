import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { zetroPreparedTaskHandoffSchema, type ZetroAgentTask, type ZetroCreateAgentTask, type ZetroHandoffReceipt, type ZetroPreparedTaskHandoff } from "@codexsun/zetro-contracts";

type TaskRow = {
  acceptance_criteria: string;
  brief_id: string;
  created_at: number;
  id: string;
  project_reference: string | null;
  project_scope: "project" | "all-projects";
  priority: "low" | "medium" | "high";
  delivered_at: string | null;
  delivery_attempted_at: string | null;
  delivery_error: string | null;
  delivery_status: "delivering" | "delivered" | "failed" | null;
  payload_json: string | null;
  status: "prepared";
  summary: string;
  title: string;
  updated_at: number;
  zuno_handoff_id: string | null;
};

export class TaskStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS zetro_agent_tasks (
        id TEXT PRIMARY KEY,
        brief_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        acceptance_criteria TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        project_scope TEXT NOT NULL CHECK(project_scope IN ('project', 'all-projects')),
        project_reference TEXT,
        status TEXT NOT NULL CHECK(status IN ('prepared')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS zetro_task_deliveries (
        task_id TEXT PRIMARY KEY REFERENCES zetro_agent_tasks(id) ON DELETE CASCADE,
        status TEXT NOT NULL CHECK(status IN ('delivering', 'delivered', 'failed')),
        attempted_at TEXT NOT NULL,
        delivered_at TEXT,
        error TEXT,
        zuno_handoff_id TEXT,
        payload_json TEXT NOT NULL
      );
    `);
    for (const statement of ["ALTER TABLE zetro_agent_tasks ADD COLUMN acceptance_criteria TEXT NOT NULL DEFAULT '';", "ALTER TABLE zetro_agent_tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium';"]) try { this.database.exec(statement); } catch { /* Existing database. */ }
  }

  close(): void {
    this.database.close();
  }

  list(): ZetroAgentTask[] {
    return (this.database.prepare(`${taskSelect} ORDER BY task.updated_at DESC`).all() as unknown as TaskRow[]).map(toTask);
  }

  get(id: string): ZetroAgentTask | undefined {
    const row = this.database.prepare(`${taskSelect} WHERE task.id = ?`).get(id) as TaskRow | undefined;
    return row ? toTask(row) : undefined;
  }

  create(input: ZetroCreateAgentTask): ZetroAgentTask {
    const now = Date.now();
    const task = { ...input, createdAt: toIso(now), deliveredAt: null, deliveryAttemptedAt: null, deliveryError: null, id: randomUUID(), status: "prepared" as const, updatedAt: toIso(now), zunoHandoffId: null };
    this.database.prepare("INSERT INTO zetro_agent_tasks (id, brief_id, title, summary, acceptance_criteria, priority, project_scope, project_reference, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(task.id, task.briefId, task.title, task.summary, task.acceptanceCriteria, task.priority, task.projectScope, task.projectReference, task.status, now, now);
    return task;
  }

  deliveryPayload(taskId: string): ZetroPreparedTaskHandoff | undefined {
    const row = this.database.prepare("SELECT payload_json FROM zetro_task_deliveries WHERE task_id = ?").get(taskId) as Pick<TaskRow, "payload_json"> | undefined;
    return row?.payload_json ? zetroPreparedTaskHandoffSchema.parse(JSON.parse(row.payload_json)) : undefined;
  }

  beginDelivery(taskId: string, handoff: ZetroPreparedTaskHandoff): ZetroAgentTask {
    const attemptedAt = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO zetro_task_deliveries (task_id, status, attempted_at, delivered_at, error, zuno_handoff_id, payload_json)
      VALUES (?, 'delivering', ?, NULL, NULL, NULL, ?)
      ON CONFLICT(task_id) DO UPDATE SET status = 'delivering', attempted_at = excluded.attempted_at, error = NULL
    `).run(taskId, attemptedAt, JSON.stringify(handoff));
    return this.required(taskId);
  }

  markDelivered(taskId: string, receipt: ZetroHandoffReceipt): ZetroAgentTask {
    this.database.prepare("UPDATE zetro_task_deliveries SET status = 'delivered', delivered_at = ?, error = NULL, zuno_handoff_id = ? WHERE task_id = ?").run(receipt.acceptedAt, receipt.zunoHandoffId, taskId);
    return this.required(taskId);
  }

  markFailed(taskId: string, message: string): ZetroAgentTask {
    this.database.prepare("UPDATE zetro_task_deliveries SET status = 'failed', error = ? WHERE task_id = ?").run(message.slice(0, 2_000), taskId);
    return this.required(taskId);
  }

  private required(id: string): ZetroAgentTask {
    const task = this.get(id);
    if (!task) throw new Error("Prepared task not found.");
    return task;
  }
}

function toTask(row: TaskRow): ZetroAgentTask {
  return {
    acceptanceCriteria: row.acceptance_criteria,
    briefId: row.brief_id,
    createdAt: toIso(row.created_at),
    deliveredAt: row.delivered_at,
    deliveryAttemptedAt: row.delivery_attempted_at,
    deliveryError: row.delivery_error,
    id: row.id,
    projectReference: row.project_reference,
    projectScope: row.project_scope,
    priority: row.priority,
    status: row.delivery_status ?? row.status,
    summary: row.summary,
    title: row.title,
    updatedAt: toIso(row.updated_at),
    zunoHandoffId: row.zuno_handoff_id,
  };
}

const taskSelect = `
  SELECT task.*, delivery.status AS delivery_status, delivery.attempted_at AS delivery_attempted_at,
    delivery.delivered_at, delivery.error AS delivery_error, delivery.zuno_handoff_id, delivery.payload_json
  FROM zetro_agent_tasks task
  LEFT JOIN zetro_task_deliveries delivery ON delivery.task_id = task.id
`;

function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
