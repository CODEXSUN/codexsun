import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { AgentTaskDraft, AgentTaskPlan, AgentTaskSummary } from '@codexsun/zetro-contracts'
import type { AgentTaskDraftInput, AgentTaskStore } from '../application/agent-task.ports.js'
import { agentTaskMigrations } from './agent-task.migrations.js'

type AgentTaskRow = {
  approval_status: 'awaiting-approval'
  archived_at: number | null
  acceptance_criteria_json: string
  checks_json: string
  created_at: number
  id: string
  origin_conversation_id: string
  origin_turn_id: string
  module_path: string
  repository_path: string
  review_confirmed_at: number | null
  source_prompt: string
  source_response: string
  status: 'draft'
  title: string
  updated_at: number
}

export class AgentTaskRepository implements AgentTaskStore {
  private readonly database: DatabaseSync

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true })
    this.database = new DatabaseSync(databasePath)
    this.database.exec('PRAGMA busy_timeout = 5000')
    this.database.exec('PRAGMA journal_mode = WAL')
    this.database.exec('PRAGMA synchronous = NORMAL')
    this.applyMigrations()
  }

  createOrGet(input: AgentTaskDraftInput): AgentTaskDraft {
    this.database
      .prepare(
        `INSERT INTO agent_task_drafts
          (id, origin_conversation_id, origin_turn_id, title, source_prompt, source_response,
           status, approval_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'draft', 'awaiting-approval', ?, ?)
         ON CONFLICT(origin_turn_id) DO NOTHING`,
      )
      .run(
        input.id,
        input.originConversationId,
        input.originTurnId,
        input.title,
        input.sourcePrompt,
        input.sourceResponse,
        input.createdAt,
        input.createdAt,
      )
    const task = this.getByOrigin(input.originTurnId)
    if (!task) throw new Error('Agent task draft could not be stored.')
    return task
  }

  get(taskId: string): AgentTaskDraft | undefined {
    return mapRow(
      this.database.prepare('SELECT * FROM agent_task_drafts WHERE id = ?').get(taskId) as
        AgentTaskRow | undefined,
    )
  }

  isReady(): boolean {
    try {
      this.database.prepare('SELECT 1 FROM agent_task_drafts LIMIT 1').get()
      return true
    } catch {
      return false
    }
  }

  list(): AgentTaskSummary[] {
    return (
      this.database
        .prepare('SELECT * FROM agent_task_drafts WHERE archived_at IS NULL ORDER BY updated_at DESC, id')
        .all() as unknown as AgentTaskRow[]
    ).map(({ source_prompt: _prompt, source_response: _response, ...row }) => mapSummary(row))
  }

  updatePlan(taskId: string, plan: AgentTaskPlan): AgentTaskDraft {
    const result = this.database
      .prepare(
        `UPDATE agent_task_drafts
         SET repository_path = ?, module_path = ?, acceptance_criteria_json = ?, checks_json = ?,
             review_confirmed_at = NULL, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        plan.repositoryPath,
        plan.modulePath,
        JSON.stringify(plan.acceptanceCriteria),
        JSON.stringify(plan.checks),
        Date.now(),
        taskId,
      )
    if (result.changes !== 1) throw new Error('Agent task draft was not found.')
    return this.get(taskId) as AgentTaskDraft
  }

  confirmReview(taskId: string, confirmedAt: number): AgentTaskDraft {
    const result = this.database
      .prepare('UPDATE agent_task_drafts SET review_confirmed_at = ?, updated_at = ? WHERE id = ?')
      .run(confirmedAt, confirmedAt, taskId)
    if (result.changes !== 1) throw new Error('Agent task draft was not found.')
    return this.get(taskId) as AgentTaskDraft
  }

  updateArchive(taskId: string, archived: boolean): AgentTaskDraft {
    const now = Date.now()
    const result = this.database
      .prepare('UPDATE agent_task_drafts SET archived_at = ?, updated_at = ? WHERE id = ?')
      .run(archived ? now : null, now, taskId)
    if (result.changes !== 1) throw new Error('Agent task draft was not found.')
    return this.get(taskId) as AgentTaskDraft
  }

  close(): void {
    this.database.close()
  }

  private applyMigrations() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS zetro_agent_task_migrations (
        version INTEGER PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      ) STRICT
    `)
    for (const migration of agentTaskMigrations) {
      const checksum = createHash('sha256').update(migration.sql).digest('hex')
      const applied = this.database
        .prepare('SELECT checksum FROM zetro_agent_task_migrations WHERE version = ?')
        .get(migration.version) as { checksum: string } | undefined
      if (applied) {
        if (applied.checksum !== checksum) throw new Error('Agent task migration checksum changed.')
        continue
      }
      this.database.exec('BEGIN IMMEDIATE')
      try {
        this.database.exec(migration.sql)
        this.database
          .prepare('INSERT INTO zetro_agent_task_migrations VALUES (?, ?, ?)')
          .run(migration.version, checksum, Date.now())
        this.database.exec('COMMIT')
      } catch (error) {
        this.database.exec('ROLLBACK')
        throw error
      }
    }
  }

  private getByOrigin(originTurnId: string) {
    return mapRow(
      this.database
        .prepare('SELECT * FROM agent_task_drafts WHERE origin_turn_id = ?')
        .get(originTurnId) as AgentTaskRow | undefined,
    )
  }
}

function mapRow(row: AgentTaskRow | undefined): AgentTaskDraft | undefined {
  if (!row) return undefined
  return {
    acceptanceCriteria: parseList(row.acceptance_criteria_json),
    approvalStatus: row.approval_status,
    archivedAt: row.archived_at ?? undefined,
    checks: parseList(row.checks_json),
    createdAt: row.created_at,
    id: row.id,
    originConversationId: row.origin_conversation_id,
    originTurnId: row.origin_turn_id,
    modulePath: row.module_path,
    repositoryPath: row.repository_path,
    reviewConfirmedAt: row.review_confirmed_at ?? undefined,
    sourcePrompt: row.source_prompt,
    sourceResponse: row.source_response,
    status: row.status,
    title: row.title,
    updatedAt: row.updated_at,
  }
}

function mapSummary(
  row: Omit<AgentTaskRow, 'source_prompt' | 'source_response'>,
): AgentTaskSummary {
  return {
    approvalStatus: row.approval_status,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    id: row.id,
    originConversationId: row.origin_conversation_id,
    originTurnId: row.origin_turn_id,
    status: row.status,
    title: row.title,
    updatedAt: row.updated_at,
  }
}

function parseList(value: string) {
  const parsed: unknown = JSON.parse(value)
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    throw new Error('Agent task draft has invalid list data.')
  }
  return parsed
}
