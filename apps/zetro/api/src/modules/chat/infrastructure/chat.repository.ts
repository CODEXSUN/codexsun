import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { dirname } from 'node:path'
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
    this.database.exec('PRAGMA foreign_keys = ON')
    this.database.exec('PRAGMA journal_mode = WAL')
    this.database.exec('PRAGMA synchronous = NORMAL')
    this.applyMigrations()
    this.recoverInterruptedTurns()
  }

  startTurn(sessionId: string, turnId: string, prompt: string, startedAt: number): void {
    this.database.exec('BEGIN IMMEDIATE')
    try {
      this.database
        .prepare(
          `INSERT INTO chat_sessions (id, created_at, updated_at) VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
        )
        .run(sessionId, startedAt, startedAt)
      const active = this.database
        .prepare("SELECT id FROM chat_turns WHERE session_id = ? AND status = 'working'")
        .get(sessionId)
      if (active) throw new Error('This Zetro chat is already responding.')
      this.database
        .prepare(
          `INSERT INTO chat_turns (id, session_id, prompt, status, started_at)
           VALUES (?, ?, ?, 'working', ?)`,
        )
        .run(turnId, sessionId, prompt, startedAt)
      this.database.exec('COMMIT')
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  appendEvent(turnId: string, event: ChatStreamEvent): ChatStoredEvent {
    const createdAt = Date.now()
    const result = this.database
      .prepare(
        `INSERT INTO chat_turn_events (turn_id, sequence, event_json, created_at)
         SELECT ?, COALESCE(MAX(sequence), 0) + 1, ?, ?
         FROM chat_turn_events WHERE turn_id = ?`,
      )
      .run(turnId, JSON.stringify(event), createdAt, turnId)
    const stored = this.database
      .prepare('SELECT sequence FROM chat_turn_events WHERE id = ?')
      .get(result.lastInsertRowid) as { sequence: number } | undefined
    if (!stored) throw new Error('Zetro could not persist the chat event.')
    return { event, sequence: stored.sequence }
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

  getProviderThreadId(sessionId: string): string | undefined {
    const row = this.database
      .prepare('SELECT provider_thread_id FROM chat_sessions WHERE id = ?')
      .get(sessionId) as { provider_thread_id: string | null } | undefined
    return row?.provider_thread_id ?? undefined
  }

  setProviderThreadId(sessionId: string, threadId: string): void {
    this.database
      .prepare('UPDATE chat_sessions SET provider_thread_id = ?, updated_at = ? WHERE id = ?')
      .run(threadId, Date.now(), sessionId)
  }

  ownsTurn(sessionId: string, turnId: string): boolean {
    return (
      this.database
        .prepare('SELECT 1 FROM chat_turns WHERE id = ? AND session_id = ?')
        .get(turnId, sessionId) !== undefined
    )
  }

  getTurnStatus(turnId: string): ChatTurnStatus | undefined {
    const row = this.database.prepare('SELECT status FROM chat_turns WHERE id = ?').get(turnId) as
      { status: ChatTurnStatus } | undefined
    return row?.status
  }

  finishTurn(turnId: string, status: ChatTurnStatus, errorMessage?: string): void {
    const completedAt = Date.now()
    this.database
      .prepare(
        `UPDATE chat_turns
         SET status = ?, completed_at = ?, error_message = ?
         WHERE id = ?`,
      )
      .run(status, completedAt, errorMessage ?? null, turnId)
    this.database
      .prepare(
        `UPDATE chat_sessions SET updated_at = ?
         WHERE id = (SELECT session_id FROM chat_turns WHERE id = ?)`,
      )
      .run(completedAt, turnId)
  }

  getHistory(sessionId: string): ChatHistoryResponse {
    const turns = this.database
      .prepare(
        `SELECT id, prompt, status, started_at, completed_at
         FROM chat_turns WHERE session_id = ? ORDER BY started_at, id`,
      )
      .all(sessionId) as TurnRow[]

    return {
      sessionId,
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
      this.appendEvent(id, { message, type: 'error' })
      this.finishTurn(id, 'failed', message)
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
