import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { AgentTaskDraft, AgentTaskSummary } from '@codexsun/zetro-contracts'
import type { AgentTaskDraftInput, AgentTaskStore } from '../application/agent-task.ports.js'
import { agentTaskMigrations } from './agent-task.migrations.js'

type AgentTaskRow = {
  approval_status: 'awaiting-approval'
  created_at: number
  id: string
  origin_conversation_id: string
  origin_turn_id: string
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
        .prepare('SELECT * FROM agent_task_drafts ORDER BY updated_at DESC, id')
        .all() as unknown as AgentTaskRow[]
    ).map(({ source_prompt: _prompt, source_response: _response, ...row }) => mapSummary(row))
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
    approvalStatus: row.approval_status,
    createdAt: row.created_at,
    id: row.id,
    originConversationId: row.origin_conversation_id,
    originTurnId: row.origin_turn_id,
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
    createdAt: row.created_at,
    id: row.id,
    originConversationId: row.origin_conversation_id,
    originTurnId: row.origin_turn_id,
    status: row.status,
    title: row.title,
    updatedAt: row.updated_at,
  }
}
