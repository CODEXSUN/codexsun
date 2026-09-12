import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  chatStreamEventSchema,
  type ChatConversationListScope,
  type ChatConversationProvider,
  type ChatConversationSummary,
  type ChatConversationUpdateRequest,
  type ChatHandoffItem,
  type ChatHistoryResponse,
  type ChatStoredEvent,
  type ChatStreamEvent,
  type ChatTurnProviderSnapshot,
  type ChatTurnStatus,
} from '@codexsun/zetro-contracts'
import { chatMigrations } from './chat.migrations.js'

type TurnRow = {
  completed_at: number | null
  id: string
  prompt: string
  provider_connection_id: string | null
  provider_kind: ChatTurnProviderSnapshot['kind'] | null
  provider_label: string | null
  provider_model: string | null
  provider_reasoning_effort: ChatTurnProviderSnapshot['reasoningEffort'] | null
  started_at: number
  status: ChatTurnStatus
}

type ConversationRow = {
  archived_at: number | null
  created_at: number
  id: string
  last_turn_status: ChatTurnStatus | null
  provider_connection_id: string
  provider_latency_ms: number | null
  provider_model: string | null
  provider_reasoning_effort: ChatConversationProvider['reasoningEffort']
  provider_status: ChatConversationProvider['status']
  provider_verified_at: number | null
  title: string | null
  turn_count: number
  updated_at: number
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
    connection: ChatTurnProviderSnapshot,
  ): ChatStoredEvent {
    this.database.exec('BEGIN IMMEDIATE')
    try {
      this.database
        .prepare(
          `INSERT INTO chat_conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             title = COALESCE(chat_conversations.title, excluded.title),
             updated_at = excluded.updated_at`,
        )
        .run(conversationId, titleFromPrompt(prompt), startedAt, startedAt)
      const conversation = this.database
        .prepare('SELECT archived_at FROM chat_conversations WHERE id = ?')
        .get(conversationId) as { archived_at: number | null }
      if (conversation.archived_at !== null) {
        throw new Error('Restore this conversation before starting a new response.')
      }
      if (this.getActiveTurnId(conversationId)) {
        throw new Error('This Zetro conversation is already responding.')
      }
      this.database
        .prepare(
          `INSERT INTO chat_turns
            (id, conversation_id, prompt, status, started_at, provider_connection_id,
             provider_kind, provider_label, provider_model, provider_reasoning_effort)
           VALUES (?, ?, ?, 'working', ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          turnId,
          conversationId,
          prompt,
          startedAt,
          connection.connectionId,
          connection.kind,
          connection.label,
          connection.model ?? null,
          connection.reasoningEffort,
        )
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

  getConversationProvider(conversationId: string): ChatConversationProvider | undefined {
    const conversation = this.getConversation(conversationId)
    return conversation?.provider
  }

  getProviderThreadId(conversationId: string, connectionId: string): string | undefined {
    const row = this.database
      .prepare(
        `SELECT thread_id FROM chat_provider_threads
         WHERE conversation_id = ? AND connection_id = ?`,
      )
      .get(conversationId, connectionId) as { thread_id: string } | undefined
    return row?.thread_id
  }

  setProviderThreadId(conversationId: string, connectionId: string, threadId: string): void {
    this.database
      .prepare(
        `INSERT INTO chat_provider_threads
          (conversation_id, connection_id, thread_id, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(conversation_id, connection_id) DO UPDATE SET
           thread_id = excluded.thread_id,
           updated_at = excluded.updated_at`,
      )
      .run(conversationId, connectionId, threadId, Date.now())
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
        `SELECT id, prompt, status, started_at, completed_at, provider_connection_id,
                provider_kind, provider_label, provider_model, provider_reasoning_effort
         FROM chat_turns WHERE conversation_id = ? ORDER BY started_at, id`,
      )
      .all(conversationId) as TurnRow[]
    return {
      conversationId,
      turns: turns.map((turn) => ({
        completedAt: turn.completed_at ?? undefined,
        connection:
          turn.provider_connection_id &&
          turn.provider_kind &&
          turn.provider_label &&
          turn.provider_reasoning_effort
            ? {
                connectionId: turn.provider_connection_id,
                kind: turn.provider_kind,
                label: turn.provider_label,
                model: turn.provider_model ?? undefined,
                reasoningEffort: turn.provider_reasoning_effort,
              }
            : undefined,
        events: this.getEvents(turn.id),
        id: turn.id,
        prompt: turn.prompt,
        startedAt: turn.started_at,
        status: turn.status,
      })),
    }
  }

  listHandoffItems(): ChatHandoffItem[] {
    const rows = this.database
      .prepare(
        `SELECT handoff.turn_id, handoff.selected_at, turn.conversation_id, conversation.title
         FROM chat_handoff_items handoff
         JOIN chat_turns turn ON turn.id = handoff.turn_id
         JOIN chat_conversations conversation ON conversation.id = turn.conversation_id
         ORDER BY handoff.selected_at, handoff.turn_id`,
      )
      .all() as Array<{
        conversation_id: string
        selected_at: number
        title: string | null
        turn_id: string
      }>
    return rows.flatMap((row) => {
      const source = this.getTaskSource(row.conversation_id, row.turn_id)
      if (source?.status !== 'complete' || !source.response) return []
      return [{
        conversationId: row.conversation_id,
        conversationTitle: row.title ?? defaultConversationTitle,
        response: source.response,
        selectedAt: row.selected_at,
        turnId: row.turn_id,
      }]
    })
  }

  setHandoffItem(conversationId: string, turnId: string, selected: boolean): ChatHandoffItem[] {
    if (!this.ownsTurn(conversationId, turnId)) throw new Error('Chat turn was not found in this conversation.')
    if (selected) {
      const source = this.getTaskSource(conversationId, turnId)
      if (source?.status !== 'complete' || !source.response) {
        throw new Error('Only completed responses can be added to the Handoff Tray.')
      }
      this.database
        .prepare(
          `INSERT INTO chat_handoff_items (turn_id, selected_at) VALUES (?, ?)
           ON CONFLICT(turn_id) DO NOTHING`,
        )
        .run(turnId, Date.now())
    } else {
      this.database.prepare('DELETE FROM chat_handoff_items WHERE turn_id = ?').run(turnId)
    }
    return this.listHandoffItems()
  }

  getTaskSource(conversationId: string, turnId: string) {
    const turn = this.getHistory(conversationId).turns.find(({ id }) => id === turnId)
    if (!turn) return undefined
    const response = turn.events
      .filter(({ event }) => event.type === 'response')
      .map(({ event }) => (event.type === 'response' ? event.delta : ''))
      .join('')
    return { prompt: turn.prompt, response, status: turn.status }
  }

  createConversation(
    conversationId: string,
    title: string | undefined,
    createdAt: number,
    provider: ChatConversationProvider,
  ): ChatConversationSummary {
    this.database
      .prepare(
        `INSERT INTO chat_conversations
          (id, title, created_at, updated_at, provider_connection_id, provider_model,
           provider_reasoning_effort, provider_status, provider_verified_at, provider_latency_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        conversationId,
        title ?? null,
        createdAt,
        createdAt,
        provider.connectionId,
        provider.model ?? null,
        provider.reasoningEffort,
        provider.status,
        provider.verifiedAt ?? null,
        provider.latencyMs ?? null,
      )
    return this.getConversation(conversationId) as ChatConversationSummary
  }

  listConversations(scope: ChatConversationListScope): ChatConversationSummary[] {
    const filter =
      scope === 'active'
        ? 'WHERE conversation.archived_at IS NULL'
        : scope === 'archived'
          ? 'WHERE conversation.archived_at IS NOT NULL'
          : ''
    return this.database
      .prepare(
        `${conversationSelect} ${filter} ${conversationGroup} ORDER BY conversation.updated_at DESC, conversation.id`,
      )
      .all()
      .map((row) => mapConversation(row as ConversationRow))
  }

  updateConversation(
    conversationId: string,
    update: ChatConversationUpdateRequest,
    updatedAt: number,
  ): ChatConversationSummary | undefined {
    const current = this.getConversation(conversationId)
    if (!current) return undefined
    const title = update.title ?? current.title
    const archivedAt =
      update.archived === undefined
        ? (current.archivedAt ?? null)
        : update.archived
          ? updatedAt
          : null
    this.database
      .prepare(
        `UPDATE chat_conversations
         SET title = ?, archived_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(title === defaultConversationTitle ? null : title, archivedAt, updatedAt, conversationId)
    return this.getConversation(conversationId)
  }

  updateConversationProvider(
    conversationId: string,
    provider: ChatConversationProvider,
    updatedAt: number,
  ): ChatConversationSummary | undefined {
    const result = this.database
      .prepare(
        `UPDATE chat_conversations
         SET provider_connection_id = ?, provider_model = ?, provider_reasoning_effort = ?,
             provider_status = ?, provider_verified_at = ?, provider_latency_ms = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        provider.connectionId,
        provider.model ?? null,
        provider.reasoningEffort,
        provider.status,
        provider.verifiedAt ?? null,
        provider.latencyMs ?? null,
        updatedAt,
        conversationId,
      )
    return result.changes ? this.getConversation(conversationId) : undefined
  }

  isReady(): boolean {
    return this.database.prepare('SELECT 1 AS ready').get() !== undefined
  }

  close(): void {
    this.database.close()
  }

  private getConversation(conversationId: string): ChatConversationSummary | undefined {
    const row = this.database
      .prepare(`${conversationSelect} WHERE conversation.id = ? ${conversationGroup}`)
      .get(conversationId) as ConversationRow | undefined
    return row ? mapConversation(row) : undefined
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

const defaultConversationTitle = 'New conversation'

const conversationSelect = `
  SELECT
    conversation.id,
    conversation.title,
    conversation.created_at,
    conversation.updated_at,
    conversation.archived_at,
    conversation.provider_connection_id,
    conversation.provider_model,
    conversation.provider_reasoning_effort,
    conversation.provider_status,
    conversation.provider_verified_at,
    conversation.provider_latency_ms,
    COUNT(turn.id) AS turn_count,
    (
      SELECT latest.status
      FROM chat_turns AS latest
      WHERE latest.conversation_id = conversation.id
      ORDER BY latest.started_at DESC, latest.id DESC
      LIMIT 1
    ) AS last_turn_status
  FROM chat_conversations AS conversation
  LEFT JOIN chat_turns AS turn ON turn.conversation_id = conversation.id
`

const conversationGroup = 'GROUP BY conversation.id'

function mapConversation(row: ConversationRow): ChatConversationSummary {
  return {
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    id: row.id,
    lastTurnStatus: row.last_turn_status ?? undefined,
    provider: {
      connectionId: row.provider_connection_id,
      latencyMs: row.provider_latency_ms ?? undefined,
      model: row.provider_model ?? undefined,
      reasoningEffort: row.provider_reasoning_effort,
      status: row.provider_status,
      verifiedAt: row.provider_verified_at ?? undefined,
    },
    title: row.title?.trim() || defaultConversationTitle,
    turnCount: row.turn_count,
    updatedAt: row.updated_at,
  }
}

function titleFromPrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, ' ').slice(0, 120) || defaultConversationTitle
}
