import { createHash } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { CodingWorkerAttempt, CodingWorkerCheckResult } from '@codexsun/zetro-contracts'
import type { CodingWorkerStore } from '../application/coding-worker.ports.js'
import { codingWorkerMigrations } from './coding-worker.migrations.js'

type WorkerRow = {
  acceptance_criteria_json: string
  approval_status: CodingWorkerAttempt['approvalStatus']
  branch_name: string
  checks_json: string
  created_at: number
  id: string
  module_path: string
  repository_path: string
  revision: string
  runtime: 'isolated-worktree'
  status: 'prepared'
  task_id: string
  tool_profile: 'daily-coding'
  updated_at: number
  verification_json: string
  worktree_path: string
}

export class CodingWorkerRepository implements CodingWorkerStore {
  private readonly database: DatabaseSync

  constructor(databasePath: string) {
    mkdirSync(dirname(databasePath), { recursive: true })
    this.database = new DatabaseSync(databasePath)
    this.database.exec('PRAGMA busy_timeout = 5000')
    this.database.exec('PRAGMA journal_mode = WAL')
    this.applyMigrations()
  }

  create(attempt: CodingWorkerAttempt): CodingWorkerAttempt {
    this.database
      .prepare(
        `INSERT INTO coding_worker_attempts
          (id, task_id, repository_path, module_path, worktree_path, branch_name, revision, runtime,
           tool_profile, acceptance_criteria_json, checks_json, status, created_at, approval_status,
           verification_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        attempt.id,
        attempt.taskId,
        attempt.repositoryPath,
        attempt.modulePath,
        attempt.worktreePath,
        attempt.branchName,
        attempt.revision,
        attempt.runtime,
        attempt.toolProfile,
        JSON.stringify(attempt.acceptanceCriteria),
        JSON.stringify(attempt.checks),
        attempt.status,
        attempt.createdAt,
        attempt.approvalStatus,
        JSON.stringify(attempt.verification),
        attempt.updatedAt,
      )
    return attempt
  }

  isReady(): boolean {
    try {
      this.database.prepare('SELECT 1 FROM coding_worker_attempts LIMIT 1').get()
      return true
    } catch {
      return false
    }
  }

  get(attemptId: string): CodingWorkerAttempt | undefined {
    const row = this.database
      .prepare('SELECT * FROM coding_worker_attempts WHERE id = ?')
      .get(attemptId) as WorkerRow | undefined
    return row ? mapRow(row) : undefined
  }

  list(): CodingWorkerAttempt[] {
    return (
      this.database
        .prepare('SELECT * FROM coding_worker_attempts ORDER BY created_at DESC, id')
        .all() as unknown as WorkerRow[]
    ).map(mapRow)
  }

  updateApproval(
    attemptId: string,
    approvalStatus: CodingWorkerAttempt['approvalStatus'],
  ): CodingWorkerAttempt {
    const result = this.database
      .prepare('UPDATE coding_worker_attempts SET approval_status = ?, updated_at = ? WHERE id = ?')
      .run(approvalStatus, Date.now(), attemptId)
    if (result.changes !== 1) throw new Error('Coding worker attempt was not found.')
    return this.get(attemptId) as CodingWorkerAttempt
  }

  updateVerification(
    attemptId: string,
    verification: CodingWorkerCheckResult[],
  ): CodingWorkerAttempt {
    const approvalStatus = verification.every((result) => result.passed)
      ? 'awaiting-approval'
      : 'awaiting-verification'
    const result = this.database
      .prepare(
        'UPDATE coding_worker_attempts SET verification_json = ?, approval_status = ?, updated_at = ? WHERE id = ?',
      )
      .run(JSON.stringify(verification), approvalStatus, Date.now(), attemptId)
    if (result.changes !== 1) throw new Error('Coding worker attempt was not found.')
    return this.get(attemptId) as CodingWorkerAttempt
  }

  close() {
    this.database.close()
  }

  private applyMigrations() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS zetro_coding_worker_migrations (
        version INTEGER PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      ) STRICT
    `)
    for (const migration of codingWorkerMigrations) {
      const checksum = createHash('sha256').update(migration.sql).digest('hex')
      const applied = this.database
        .prepare('SELECT checksum FROM zetro_coding_worker_migrations WHERE version = ?')
        .get(migration.version) as { checksum: string } | undefined
      if (applied) {
        if (applied.checksum !== checksum)
          throw new Error('Coding worker migration checksum changed.')
        continue
      }
      this.database.exec('BEGIN IMMEDIATE')
      try {
        this.database.exec(migration.sql)
        this.database
          .prepare('INSERT INTO zetro_coding_worker_migrations VALUES (?, ?, ?)')
          .run(migration.version, checksum, Date.now())
        this.database.exec('COMMIT')
      } catch (error) {
        this.database.exec('ROLLBACK')
        throw error
      }
    }
  }
}

function mapRow(row: WorkerRow): CodingWorkerAttempt {
  return {
    acceptanceCriteria: parseList(row.acceptance_criteria_json),
    approvalStatus: row.approval_status,
    branchName: row.branch_name,
    checks: parseList(row.checks_json),
    createdAt: row.created_at,
    id: row.id,
    modulePath: row.module_path,
    repositoryPath: row.repository_path,
    revision: row.revision,
    runtime: row.runtime,
    status: row.status,
    taskId: row.task_id,
    toolProfile: row.tool_profile,
    updatedAt: row.updated_at || row.created_at,
    verification: parseVerification(row.verification_json),
    worktreePath: row.worktree_path,
  }
}

function parseVerification(value: string): CodingWorkerCheckResult[] {
  const parsed: unknown = JSON.parse(value)
  if (!Array.isArray(parsed)) throw new Error('Coding worker record has invalid verification data.')
  return parsed as CodingWorkerCheckResult[]
}

function parseList(value: string) {
  const parsed: unknown = JSON.parse(value)
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
    throw new Error('Coding worker record has invalid list data.')
  }
  return parsed
}
