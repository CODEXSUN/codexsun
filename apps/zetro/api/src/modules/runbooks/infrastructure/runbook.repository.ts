import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Runbook, RunbookRun } from '@codexsun/zetro-contracts'
import type { RunbookStore } from '../application/runbook.ports.js'
import { runbookMigrations } from './runbook.migrations.js'

type RunbookRow = { archived_at: number | null; id: string; title: string; prompt: string; repository_path: string; module_path: string; interval_minutes: number; schedule_mode: 'one-time' | 'repeating'; enabled: number; next_run_at: number; last_run_at: number | null; created_at: number; updated_at: number }
type RunRow = { id: string; runbook_id: string; triggered_by: 'manual' | 'schedule'; status: RunbookRun['status']; branch_name: string; worktree_path: string; report: string; created_at: number; started_at: number | null; completed_at: number | null; initiator_json: string }

export class SqliteRunbookRepository implements RunbookStore {
  private readonly database: DatabaseSync
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true })
    this.database = new DatabaseSync(path)
    this.database.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL')
    this.applyMigrations()
  }
  create(runbook: Runbook) {
    this.database.prepare('INSERT INTO runbooks (id, title, prompt, repository_path, module_path, interval_minutes, enabled, next_run_at, last_run_at, created_at, updated_at, schedule_mode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(runbook.id, runbook.title, runbook.prompt, runbook.repositoryPath, runbook.modulePath, runbook.schedule.intervalMinutes ?? 0, Number(runbook.enabled), runbook.nextRunAt, runbook.lastRunAt ?? null, runbook.createdAt, runbook.updatedAt, runbook.schedule.mode)
    return runbook
  }
  createRun(run: RunbookRun) {
    this.database.prepare('INSERT INTO runbook_runs (id, runbook_id, triggered_by, status, branch_name, worktree_path, report, created_at, started_at, completed_at, initiator_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(run.id, run.runbookId, run.triggeredBy, run.status, run.branchName, run.worktreePath, run.report, run.createdAt, run.startedAt ?? null, run.completedAt ?? null, JSON.stringify(run.initiator ?? {}))
    return run
  }
  get(id: string) { const row = this.database.prepare('SELECT * FROM runbooks WHERE id = ?').get(id) as RunbookRow | undefined; return row && mapRunbook(row) }
  isReady() { try { this.database.prepare('SELECT 1 FROM runbooks LIMIT 1').get(); return true } catch { return false } }
  list() { return (this.database.prepare('SELECT * FROM runbooks WHERE archived_at IS NULL ORDER BY created_at DESC').all() as unknown as RunbookRow[]).map(mapRunbook) }
  listDue(now: number) { return (this.database.prepare("SELECT * FROM runbooks WHERE enabled = 1 AND schedule_mode = 'repeating' AND next_run_at <= ?").all(now) as unknown as RunbookRow[]).map(mapRunbook) }
  listRuns() { return (this.database.prepare('SELECT * FROM runbook_runs ORDER BY created_at DESC').all() as unknown as RunRow[]).map(mapRun) }
  updateEnabled(id: string, enabled: boolean, nextRunAt: number) { this.database.prepare('UPDATE runbooks SET enabled = ?, next_run_at = ?, updated_at = ? WHERE id = ?').run(Number(enabled), nextRunAt, Date.now(), id); const value = this.get(id); if (!value) throw new Error('Runbook was not found.'); return value }
  updateArchive(id: string, archived: boolean) { const now = Date.now(); this.database.prepare('UPDATE runbooks SET archived_at = ?, enabled = 0, updated_at = ? WHERE id = ?').run(archived ? now : null, now, id); const value = this.get(id); if (!value) throw new Error('Runbook was not found.'); return value }
  updateRun(run: RunbookRun) { this.database.prepare('UPDATE runbook_runs SET status = ?, report = ?, started_at = ?, completed_at = ? WHERE id = ?').run(run.status, run.report, run.startedAt ?? null, run.completedAt ?? null, run.id); return run }
  markScheduled(id: string, lastRunAt: number, nextRunAt: number) { this.database.prepare('UPDATE runbooks SET last_run_at = ?, next_run_at = ?, updated_at = ? WHERE id = ?').run(lastRunAt, nextRunAt, lastRunAt, id) }
  close() { this.database.close() }
  private applyMigrations() { this.database.exec('CREATE TABLE IF NOT EXISTS zetro_runbook_migrations (version INTEGER PRIMARY KEY, checksum TEXT NOT NULL, applied_at INTEGER NOT NULL) STRICT'); for (const migration of runbookMigrations) { const checksum = createHash('sha256').update(migration.sql).digest('hex'); const applied = this.database.prepare('SELECT checksum FROM zetro_runbook_migrations WHERE version = ?').get(migration.version) as { checksum: string } | undefined; if (applied) { if (applied.checksum !== checksum) throw new Error('Runbook migration checksum changed.'); continue } this.database.exec('BEGIN IMMEDIATE'); try { this.database.exec(migration.sql); this.database.prepare('INSERT INTO zetro_runbook_migrations VALUES (?, ?, ?)').run(migration.version, checksum, Date.now()); this.database.exec('COMMIT') } catch (error) { this.database.exec('ROLLBACK'); throw error } } }
}
function mapRunbook(row: RunbookRow): Runbook { return { archivedAt: row.archived_at ?? undefined, id: row.id, title: row.title, prompt: row.prompt, repositoryPath: row.repository_path, modulePath: row.module_path, schedule: row.schedule_mode === 'one-time' ? { mode: 'one-time' } : { mode: 'repeating', intervalMinutes: row.interval_minutes }, enabled: Boolean(row.enabled), nextRunAt: row.next_run_at, lastRunAt: row.last_run_at ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at } }
function mapRun(row: RunRow): RunbookRun { const initiator = JSON.parse(row.initiator_json) as unknown; return { id: row.id, runbookId: row.runbook_id, triggeredBy: row.triggered_by, status: row.status, branchName: row.branch_name, worktreePath: row.worktree_path, report: row.report, initiator: isInitiator(initiator) ? initiator : undefined, createdAt: row.created_at, startedAt: row.started_at ?? undefined, completedAt: row.completed_at ?? undefined } }
function isInitiator(value: unknown): value is { itemId: string; moduleId: string } { return typeof value === 'object' && value !== null && typeof Reflect.get(value, 'itemId') === 'string' && typeof Reflect.get(value, 'moduleId') === 'string' }
