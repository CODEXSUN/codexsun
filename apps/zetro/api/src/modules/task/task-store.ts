import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ZetroAgentTask, ZetroCreateAgentTask } from "@codexsun/zetro-contracts";

type TaskRow = {
  brief_id: string;
  created_at: number;
  id: string;
  project_reference: string | null;
  project_scope: "project" | "all-projects";
  status: "prepared";
  summary: string;
  title: string;
  updated_at: number;
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
        project_scope TEXT NOT NULL CHECK(project_scope IN ('project', 'all-projects')),
        project_reference TEXT,
        status TEXT NOT NULL CHECK(status IN ('prepared')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  close(): void {
    this.database.close();
  }

  list(): ZetroAgentTask[] {
    return (this.database.prepare("SELECT * FROM zetro_agent_tasks ORDER BY updated_at DESC").all() as unknown as TaskRow[]).map(toTask);
  }

  create(input: ZetroCreateAgentTask): ZetroAgentTask {
    const now = Date.now();
    const task = { ...input, createdAt: toIso(now), id: randomUUID(), status: "prepared" as const, updatedAt: toIso(now) };
    this.database.prepare("INSERT INTO zetro_agent_tasks (id, brief_id, title, summary, project_scope, project_reference, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(task.id, task.briefId, task.title, task.summary, task.projectScope, task.projectReference, task.status, now, now);
    return task;
  }
}

function toTask(row: TaskRow): ZetroAgentTask {
  return {
    briefId: row.brief_id,
    createdAt: toIso(row.created_at),
    id: row.id,
    projectReference: row.project_reference,
    projectScope: row.project_scope,
    status: row.status,
    summary: row.summary,
    title: row.title,
    updatedAt: toIso(row.updated_at),
  };
}

function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
