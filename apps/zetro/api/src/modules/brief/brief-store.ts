import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ZetroIdeaBrief, ZetroUpsertIdeaBrief } from "@codexsun/zetro-contracts";

type BriefRow = {
  audience: string;
  constraints: string;
  conversation_id: string;
  created_at: number;
  exclusions: string;
  id: string;
  outcome: string;
  project_reference: string | null;
  project_scope: "project" | "all-projects";
  risks: string;
  scope: string;
  source_message_ids: string;
  status: "draft" | "final";
  success_signals: string;
  title: string;
  updated_at: number;
};

export class BriefStore {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS zetro_idea_briefs (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        outcome TEXT NOT NULL,
        audience TEXT NOT NULL,
        scope TEXT NOT NULL,
        exclusions TEXT NOT NULL,
        constraints TEXT NOT NULL,
        risks TEXT NOT NULL,
        success_signals TEXT NOT NULL,
        project_scope TEXT NOT NULL CHECK(project_scope IN ('project', 'all-projects')),
        project_reference TEXT,
        source_message_ids TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('draft', 'final')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  close(): void {
    this.database.close();
  }

  getByConversation(conversationId: string): ZetroIdeaBrief | undefined {
    const row = this.database.prepare("SELECT * FROM zetro_idea_briefs WHERE conversation_id = ?").get(conversationId) as BriefRow | undefined;
    return row ? toBrief(row) : undefined;
  }

  get(id: string): ZetroIdeaBrief | undefined {
    const row = this.database.prepare("SELECT * FROM zetro_idea_briefs WHERE id = ?").get(id) as BriefRow | undefined;
    return row ? toBrief(row) : undefined;
  }

  save(conversationId: string, input: ZetroUpsertIdeaBrief): ZetroIdeaBrief {
    const now = Date.now();
    const current = this.getByConversation(conversationId);
    const brief = { ...input, conversationId, createdAt: current?.createdAt ?? toIso(now), id: current?.id ?? randomUUID(), updatedAt: toIso(now) };
    this.database.prepare(`
      INSERT INTO zetro_idea_briefs (id, conversation_id, title, outcome, audience, scope, exclusions, constraints, risks, success_signals, project_scope, project_reference, source_message_ids, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(conversation_id) DO UPDATE SET
        title = excluded.title, outcome = excluded.outcome, audience = excluded.audience,
        scope = excluded.scope, exclusions = excluded.exclusions, constraints = excluded.constraints,
        risks = excluded.risks, success_signals = excluded.success_signals, project_scope = excluded.project_scope,
        project_reference = excluded.project_reference, source_message_ids = excluded.source_message_ids,
        status = excluded.status, updated_at = excluded.updated_at
    `).run(brief.id, conversationId, brief.title, brief.outcome, brief.audience, brief.scope, brief.exclusions, brief.constraints, brief.risks, brief.successSignals, brief.projectScope, brief.projectReference, JSON.stringify(brief.sourceMessageIds), brief.status, now, now);
    return this.getByConversation(conversationId)!;
  }
}

function toBrief(row: BriefRow): ZetroIdeaBrief {
  return {
    audience: row.audience,
    constraints: row.constraints,
    conversationId: row.conversation_id,
    createdAt: toIso(row.created_at),
    exclusions: row.exclusions,
    id: row.id,
    outcome: row.outcome,
    projectReference: row.project_reference,
    projectScope: row.project_scope,
    risks: row.risks,
    scope: row.scope,
    sourceMessageIds: JSON.parse(row.source_message_ids),
    status: row.status,
    successSignals: row.success_signals,
    title: row.title,
    updatedAt: toIso(row.updated_at),
  };
}

function toIso(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
