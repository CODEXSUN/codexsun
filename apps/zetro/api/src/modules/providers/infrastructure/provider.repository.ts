import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type {
  ProviderAuthStatus,
  ProviderConnection,
  ProviderKind,
  ProviderReasoningEffort,
  ProviderSelectionRequest,
  ProviderSettingsResponse,
} from '@codexsun/zetro-contracts'
import type { ProviderStore } from '../application/provider.ports.js'
import { providerMigrations } from './provider.migrations.js'

type ProviderRow = {
  account_label: string | null
  auth_status: ProviderAuthStatus
  base_url: string | null
  enabled: number
  id: string
  kind: ProviderKind
  label: string
  model: string | null
  reasoning_effort: ProviderReasoningEffort
  updated_at: number
}

export class ProviderRepository implements ProviderStore {
  private readonly database: DatabaseSync

  constructor(databasePath: string, cxzUrl: string) {
    mkdirSync(dirname(databasePath), { recursive: true })
    this.database = new DatabaseSync(databasePath)
    this.database.exec('PRAGMA busy_timeout = 5000')
    this.database.exec('PRAGMA foreign_keys = ON')
    this.database.exec('PRAGMA journal_mode = WAL')
    this.database.exec('PRAGMA synchronous = NORMAL')
    this.applyMigrations()
    this.seedConnections(cxzUrl)
  }

  getSettings(): ProviderSettingsResponse {
    const selected = this.database
      .prepare('SELECT selected_connection_id FROM provider_settings WHERE id = 1')
      .get() as { selected_connection_id: string }
    const rows = this.database
      .prepare('SELECT * FROM provider_connections ORDER BY created_at, id')
      .all() as ProviderRow[]
    return {
      connections: rows.map(mapConnection),
      selectedConnectionId: selected.selected_connection_id,
    }
  }

  getConnection(connectionId: string): ProviderConnection | undefined {
    const row = this.database
      .prepare('SELECT * FROM provider_connections WHERE id = ?')
      .get(connectionId) as ProviderRow | undefined
    return row ? mapConnection(row) : undefined
  }

  select(selection: ProviderSelectionRequest, updatedAt: number): ProviderSettingsResponse {
    const connection = this.getConnection(selection.connectionId)
    if (!connection) throw new Error('Provider connection was not found.')
    if (!connection.enabled) throw new Error('This provider connection is not enabled yet.')
    this.database.exec('BEGIN IMMEDIATE')
    try {
      this.database
        .prepare(
          `UPDATE provider_connections
           SET model = ?, reasoning_effort = ?, updated_at = ? WHERE id = ?`,
        )
        .run(
          selection.model ?? connection.model ?? null,
          selection.reasoningEffort,
          updatedAt,
          connection.id,
        )
      this.database
        .prepare(
          `INSERT INTO provider_settings (id, selected_connection_id, updated_at)
           VALUES (1, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             selected_connection_id = excluded.selected_connection_id,
             updated_at = excluded.updated_at`,
        )
        .run(connection.id, updatedAt)
      this.database.exec('COMMIT')
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
    return this.getSettings()
  }

  updateAccount(
    connectionId: string,
    authStatus: ProviderAuthStatus,
    accountLabel: string | undefined,
    updatedAt: number,
  ): void {
    this.database
      .prepare(
        `UPDATE provider_connections
         SET auth_status = ?, account_label = ?, updated_at = ? WHERE id = ?`,
      )
      .run(authStatus, accountLabel ?? null, updatedAt, connectionId)
  }

  updateModel(connectionId: string, model: string, updatedAt: number): void {
    this.database
      .prepare('UPDATE provider_connections SET model = ?, updated_at = ? WHERE id = ?')
      .run(model, updatedAt, connectionId)
  }

  isReady(): boolean {
    return this.database.prepare('SELECT 1 AS ready').get() !== undefined
  }

  close(): void {
    this.database.close()
  }

  private applyMigrations(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS zetro_provider_migrations (
        version INTEGER PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      ) STRICT
    `)
    for (const migration of providerMigrations) {
      const checksum = createHash('sha256').update(migration.sql).digest('hex')
      const applied = this.database
        .prepare('SELECT checksum FROM zetro_provider_migrations WHERE version = ?')
        .get(migration.version) as { checksum: string } | undefined
      if (applied?.checksum === checksum) continue
      if (applied) throw new Error(`Zetro provider migration ${migration.version} does not match.`)
      this.database.exec('BEGIN IMMEDIATE')
      try {
        this.database.exec(migration.sql)
        this.database
          .prepare(
            'INSERT INTO zetro_provider_migrations (version, checksum, applied_at) VALUES (?, ?, ?)',
          )
          .run(migration.version, checksum, Date.now())
        this.database.exec('COMMIT')
      } catch (error) {
        this.database.exec('ROLLBACK')
        throw error
      }
    }
  }

  private seedConnections(cxzUrl: string): void {
    const now = Date.now()
    this.database
      .prepare(
        `INSERT INTO provider_connections
          (id, kind, label, base_url, model, reasoning_effort, auth_status, enabled, created_at, updated_at)
         VALUES ('codex-local', 'codex-app-server', 'Codex', NULL, NULL, 'low', 'unknown', 1, ?, ?)
         ON CONFLICT(id) DO NOTHING`,
      )
      .run(now, now)
    this.seedConnection({
      baseUrl: `${cxzUrl}/codex`,
      enabled: 1,
      id: 'cxz-codex',
      kind: 'cxz-codex',
      label: 'CXZ Codex',
      model: null,
      now,
    })
    this.database
      .prepare(
        `INSERT INTO provider_settings (id, selected_connection_id, updated_at)
         VALUES (1, 'codex-local', ?) ON CONFLICT(id) DO NOTHING`,
      )
      .run(now)
  }

  private seedConnection(input: {
    baseUrl: string
    enabled: number
    id: string
    kind: ProviderKind
    label: string
    model: string | null
    now: number
  }): void {
    this.database
      .prepare(
        `INSERT INTO provider_connections
          (id, kind, label, base_url, model, reasoning_effort, auth_status, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'low', 'unknown', ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET base_url = excluded.base_url, enabled = excluded.enabled`,
      )
      .run(
        input.id,
        input.kind,
        input.label,
        input.baseUrl,
        input.model,
        input.enabled,
        input.now,
        input.now,
      )
  }
}

function mapConnection(row: ProviderRow): ProviderConnection {
  return {
    accountLabel: row.account_label ?? undefined,
    authStatus: row.auth_status,
    baseUrl: row.base_url ?? undefined,
    enabled: row.enabled === 1,
    id: row.id,
    kind: row.kind,
    label: row.label,
    model: row.model ?? undefined,
    reasoningEffort: row.reasoning_effort,
    updatedAt: row.updated_at,
  }
}
