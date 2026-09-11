import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  chatStreamEventSchema,
  type ChatHistoryResponse,
  type ChatStoredEvent,
  type ChatStreamEvent,
  type ChatTurnStatus,
} from '@codexsun/zetro-contracts'
import { chatMigrations } from './chat.migrations.js'

type TurnRow = {
  completed_at: number | null
  id: string
  prompt: string
  started_at: number
  status: ChatTurnStatus
}

export class ChatRepository {
  private readonly database: DatabaseSync

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true })
    this.database = new DatabaseSync(databasePath)
    this.database.exec('PRAGMA busy_timeout = 5000')
    this.database.exec('PRAGMA foreign_keys = ON')
    this.database.exec('PRAGMA journal_mode = WAL')
    this.database.exec('PRAGMA synchronous = NORMAL')
    this.applyMigrations()
    this.recoverInterruptedTurns()
  }

  startTurn(
    conversationId: string,
    turnId: string,
    prompt: string,
    startedAt: number,
  ): ChatStoredEvent {
    this.database.exec('BEGIN IMMEDIATE')
    try {
      this.database
        .prepare(
          `INSERT INTO chat_conversations (id, created_at, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
        )
        .run(conversationId, startedAt, startedAt)
      if (this.getActiveTurnId(conversationId)) {
        throw new Error('This Zetro conversation is already responding.')
      }
      this.database
        .prepare(
          `INSERT INTO chat_turns (id, conversation_id, prompt, status, started_at)
           VALUES (?, ?, ?, 'working', ?)`,
        )
        .run(turnId, conversationId, prompt, startedAt)
      const request = { content: prompt, type: 'request' } as const
      this.insertEvent(turnId, 1, request, startedAt)
      this.database.exec('COMMIT')
      return { event: request, sequence: 1 }
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  appendEvent(turnId: string, event: ChatStreamEvent): ChatStoredEvent {
    const sequence = this.nextSequence(turnId)
    this.insertEvent(turnId, sequence, event, Date.now())
    return { event, sequence }
  }

  finishTurn(
    turnId: string,
    status: ChatTurnStatus,
    event: ChatStreamEvent,
    errorMessage?: string,
  ): ChatStoredEvent {
    const completedAt = Date.now()
    this.database.exec('BEGIN IMMEDIATE')
    try {
      const sequence = this.nextSequence(turnId)
      this.insertEvent(turnId, sequence, event, completedAt)
      this.database
        .prepare(
          `UPDATE chat_turns
           SET status = ?, completed_at = ?, error_message = ?
           WHERE id = ?`,
        )
        .run(status, completedAt, errorMessage ?? null, turnId)
      this.database
        .prepare(
          `UPDATE chat_conversations SET updated_at = ?
           WHERE id = (SELECT conversation_id FROM chat_turns WHERE id = ?)`,
        )
        .run(completedAt, turnId)
      this.database.exec('COMMIT')
      return { event, sequence }
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  getEvents(turnId: string, afterSequence = 0): ChatStoredEvent[] {
    const rows = this.database
      .prepare(
        `SELECT sequence, event_json FROM chat_turn_events
         WHERE turn_id = ? AND sequence > ? ORDER BY sequence`,
      )
      .all(turnId, afterSequence) as Array<{ event_json: string; sequence: number }>
    return rows.map(({ event_json, sequence }) => ({
      event: chatStreamEventSchema.parse(JSON.parse(event_json)),
      sequence,
    }))
  }

  getProviderThreadId(conversationId: string): string | undefined {
    const row = this.database
      .prepare('SELECT provider_thread_id FROM chat_conversations WHERE id = ?')
      .get(conversationId) as { provider_thread_id: string | null } | undefined
    return row?.provider_thread_id ?? undefined
  }

  setProviderThreadId(conversationId: string, threadId: string): void {
    this.database
      .prepare('UPDATE chat_conversations SET provider_thread_id = ?, updated_at = ? WHERE id = ?')
      .run(threadId, Date.now(), conversationId)
  }

  getActiveTurnId(conversationId: string): string | undefined {
    const row = this.database
      .prepare("SELECT id FROM chat_turns WHERE conversation_id = ? AND status = 'working'")
      .get(conversationId) as { id: string } | undefined
    return row?.id
  }

  ownsTurn(conversationId: string, turnId: string): boolean {
    return (
      this.database
        .prepare('SELECT 1 FROM chat_turns WHERE id = ? AND conversation_id = ?')
        .get(turnId, conversationId) !== undefined
    )
  }

  getTurnStatus(turnId: string): ChatTurnStatus | undefined {
    const row = this.database.prepare('SELECT status FROM chat_turns WHERE id = ?').get(turnId) as
      { status: ChatTurnStatus } | undefined
    return row?.status
  }

  getHistory(conversationId: string): ChatHistoryResponse {
    const turns = this.database
      .prepare(
        `SELECT id, prompt, status, started_at, completed_at
         FROM chat_turns WHERE conversation_id = ? ORDER BY started_at, id`,
      )
      .all(conversationId) as TurnRow[]
    return {
      conversationId,
      turns: turns.map((turn) => ({
        completedAt: turn.completed_at ?? undefined,
        events: this.getEvents(turn.id),
        id: turn.id,
        prompt: turn.prompt,
        startedAt: turn.started_at,
        status: turn.status,
      })),
    }
  }

  isReady(): boolean {
    return this.database.prepare('SELECT 1 AS ready').get() !== undefined
  }

  close(): void {
    this.database.close()
  }

  private nextSequence(turnId: string): number {
    const row = this.database
      .prepare(
        'SELECT COALESCE(MAX(sequence), 0) + 1 AS sequence FROM chat_turn_events WHERE turn_id = ?',
      )
      .get(turnId) as { sequence: number }
    return row.sequence
  }

  private insertEvent(
    turnId: string,
    sequence: number,
    event: ChatStreamEvent,
    createdAt: number,
  ): void {
    this.database
      .prepare(
        `INSERT INTO chat_turn_events (turn_id, sequence, event_json, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(turnId, sequence, JSON.stringify(event), createdAt)
  }

  private applyMigrations(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS zetro_schema_migrations (
        version INTEGER PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      ) STRICT
    `)
    for (const migration of chatMigrations) this.applyMigration(migration.version, migration.sql)
  }

  private recoverInterruptedTurns(): void {
    const interrupted = this.database
      .prepare("SELECT id FROM chat_turns WHERE status = 'working'")
      .all() as Array<{ id: string }>
    for (const { id } of interrupted) {
      const message = 'Zetro restarted before this turn finished. Partial output was preserved.'
      this.finishTurn(id, 'failed', { message, type: 'error' }, message)
    }
  }

  private applyMigration(version: number, sql: string): void {
    const checksum = createHash('sha256').update(sql).digest('hex')
    const applied = this.database
      .prepare('SELECT checksum FROM zetro_schema_migrations WHERE version = ?')
      .get(version) as { checksum: string } | undefined
    if (applied?.checksum === checksum) return
    if (applied) throw new Error(`Zetro migration ${version} checksum does not match.`)

    this.database.exec('BEGIN IMMEDIATE')
    try {
      this.database.exec(sql)
      this.database
        .prepare(
          'INSERT INTO zetro_schema_migrations (version, checksum, applied_at) VALUES (?, ?, ?)',
        )
        .run(version, checksum, Date.now())
      this.database.exec('COMMIT')
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }
}
