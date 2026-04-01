import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { RowDataPacket } from 'mysql2/promise'
import { systemUpdateCheckResponseSchema, systemVersionResponseSchema } from '@shared/index'
import { getDatabaseHealth, isApplicationSetupReady } from '../database/database'
import { db } from '../database/orm'
import { migrations } from '../database/migrations'
import { migrationTableName } from '../database/table-names'
import { environment } from '../config/environment'

interface AppliedMigrationRow extends RowDataPacket {
  id: string
  name: string
  applied_at: Date
}

const packageJsonPath = path.resolve(process.cwd(), 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { version?: string }
const applicationVersion = packageJson.version ?? '0.0.0'
const latestKnownMigration = migrations[migrations.length - 1]
const execFileAsync = promisify(execFile)
const runtimeGitDirectory = path.resolve(process.cwd(), '../runtime/source/.git')

async function readCurrentGitCommitSha() {
  if (!environment.runtime.git.syncEnabled) {
    return null
  }

  if (!fs.existsSync(runtimeGitDirectory)) {
    return null
  }

  try {
    const { stdout } = await execFileAsync('git', ['--git-dir', runtimeGitDirectory, 'rev-parse', 'HEAD'], {
      cwd: process.cwd(),
    })
    const sha = stdout.trim()
    return sha || null
  } catch {
    return null
  }
}

async function readRemoteGitCommitSha() {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['ls-remote', environment.runtime.git.repositoryUrl, environment.runtime.git.branch],
      { cwd: process.cwd() },
    )
    const sha = stdout.trim().split(/\s+/)[0] ?? ''
    return sha || null
  } catch {
    return null
  }
}

async function readLatestAppliedMigration() {
  const rows = await db.query<AppliedMigrationRow>(
    `
      SELECT id, name, applied_at
      FROM ${migrationTableName}
      ORDER BY id DESC
      LIMIT 1
    `,
  )

  return rows[0] ?? null
}

async function readAppliedMigrationCount() {
  const rows = await db.query<RowDataPacket & { applied_count: number }>(
    `
      SELECT COUNT(*) AS applied_count
      FROM ${migrationTableName}
    `,
  )

  return Number(rows[0]?.applied_count ?? 0)
}

export async function getSystemVersion() {
  const databaseHealth = getDatabaseHealth()
  const currentCommitSha = await readCurrentGitCommitSha()

  if (!isApplicationSetupReady()) {
    return systemVersionResponseSchema.parse({
      version: {
        application: {
          name: 'codexsun',
          version: applicationVersion,
          sourceMode: environment.runtime.git.syncEnabled ? 'git' : 'embedded',
          currentCommitSha,
        },
        database: {
          status: databaseHealth.status === 'disabled' ? 'disabled' : 'error',
          currentVersionId: null,
          currentVersionName: null,
          latestVersionId: latestKnownMigration.id,
          latestVersionName: latestKnownMigration.name,
          appliedMigrations: 0,
          pendingMigrations: migrations.length,
          checkedAt: databaseHealth.checkedAt,
          detail: databaseHealth.detail,
        },
      },
    })
  }

  const latestAppliedMigration = await readLatestAppliedMigration()
  const appliedMigrations = await readAppliedMigrationCount()
  const pendingMigrations = Math.max(0, migrations.length - appliedMigrations)

  return systemVersionResponseSchema.parse({
    version: {
      application: {
        name: 'codexsun',
        version: applicationVersion,
        sourceMode: environment.runtime.git.syncEnabled ? 'git' : 'embedded',
        currentCommitSha,
      },
      database: {
        status: 'ready',
        currentVersionId: latestAppliedMigration?.id ?? null,
        currentVersionName: latestAppliedMigration?.name ?? null,
        latestVersionId: latestKnownMigration.id,
        latestVersionName: latestKnownMigration.name,
        appliedMigrations,
        pendingMigrations,
        checkedAt: new Date().toISOString(),
        detail: pendingMigrations === 0
          ? 'Database schema is up to date.'
          : `${pendingMigrations} database migration(s) are pending.`,
      },
    },
  })
}

export async function getSystemUpdateCheck() {
  const currentCommitSha = await readCurrentGitCommitSha()
  const remoteCommitSha = await readRemoteGitCommitSha()
  const canAutoCompare = Boolean(currentCommitSha && remoteCommitSha)
  const updateAvailable = Boolean(canAutoCompare && currentCommitSha !== remoteCommitSha)

  return systemUpdateCheckResponseSchema.parse({
    update: {
      sourceMode: environment.runtime.git.syncEnabled ? 'git' : 'embedded',
      repositoryUrl: environment.runtime.git.repositoryUrl,
      branch: environment.runtime.git.branch,
      currentCommitSha,
      remoteCommitSha,
      updateAvailable,
      canAutoCompare,
      checkedAt: new Date().toISOString(),
      detail: !remoteCommitSha
        ? 'Unable to resolve the remote branch head.'
        : !currentCommitSha
          ? environment.runtime.git.syncEnabled
            ? 'The runtime Git source is not available for direct commit comparison yet.'
            : 'The running app uses the embedded image, so Git commit comparison is unavailable for the current build.'
          : updateAvailable
            ? 'A newer commit is available on the configured branch.'
            : 'The running source matches the configured remote branch head.',
    },
  })
}
