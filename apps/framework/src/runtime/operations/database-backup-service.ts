import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"

import type { Kysely } from "kysely"

import {
  databaseBackupDashboardSchema,
  databaseBackupRecordSchema,
  databaseRestoreRunSchema,
  type DatabaseBackupRecord,
  type DatabaseRestoreRun,
} from "../../../shared/database-operations.js"
import type { ServerConfig } from "../config/server-config.js"
import type { RuntimeDatabases } from "../database/client.js"
import { ApplicationError } from "../errors/application-error.js"
import { frameworkOperationsTableNames } from "./operations-table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>
type RuntimeLogger = ReturnType<typeof import("../observability/runtime-logger.js").createRuntimeLogger>

function resolveBackupSupport(config: ServerConfig) {
  return {
    supported: false,
    reason:
      "Automated backup and restore are not yet implemented for the remaining MariaDB/PostgreSQL-only runtime.",
  } as const
}

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function operationsRoot(config: ServerConfig) {
  return path.resolve(config.webRoot, "..", "..", "..", "..")
}

export function resolveDatabaseBackupRoot(config: ServerConfig) {
  return path.resolve(operationsRoot(config), "storage", "backups", "database")
}

function nowIso() {
  return new Date().toISOString()
}

function mapBackupRow(row: Record<string, unknown>) {
  return databaseBackupRecordSchema.parse({
    id: String(row.id ?? ""),
    fileName: String(row.file_name ?? ""),
    filePath: String(row.file_path ?? ""),
    driver: String(row.driver ?? "mariadb"),
    status: String(row.status ?? "completed"),
    trigger: String(row.trigger_kind ?? "manual"),
    storageTarget: String(row.storage_target ?? "local"),
    googleDriveSyncStatus: String(row.google_drive_sync_status ?? "not_configured"),
    googleDriveFileId: row.google_drive_file_id == null ? null : String(row.google_drive_file_id),
    sizeBytes: Number(row.size_bytes ?? 0),
    checksum: row.checksum == null ? null : String(row.checksum),
    summary: row.summary == null ? null : String(row.summary),
    createdAt: String(row.created_at ?? ""),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
  })
}

function parseBackupItem(item: Record<string, unknown>) {
  return databaseBackupRecordSchema.parse({
    id: String(item.id ?? ""),
    fileName: String(item.fileName ?? ""),
    filePath: String(item.filePath ?? ""),
    driver: String(item.driver ?? "mariadb"),
    status: String(item.status ?? "completed"),
    trigger: String(item.trigger ?? "manual"),
    storageTarget: String(item.storageTarget ?? "local"),
    googleDriveSyncStatus: String(item.googleDriveSyncStatus ?? "not_configured"),
    googleDriveFileId: item.googleDriveFileId == null ? null : String(item.googleDriveFileId),
    sizeBytes: Number(item.sizeBytes ?? 0),
    checksum: item.checksum == null ? null : String(item.checksum),
    summary: item.summary == null ? null : String(item.summary),
    createdAt: String(item.createdAt ?? ""),
    completedAt: item.completedAt == null ? null : String(item.completedAt),
  })
}

function mapRestoreRunRow(row: Record<string, unknown>) {
  return databaseRestoreRunSchema.parse({
    id: String(row.id ?? ""),
    backupId: String(row.backup_id ?? ""),
    mode: String(row.mode ?? "drill"),
    status: String(row.status ?? "completed"),
    summary: row.summary == null ? null : String(row.summary),
    createdAt: String(row.created_at ?? ""),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
  })
}

function parseRestoreRunItem(item: Record<string, unknown>) {
  return databaseRestoreRunSchema.parse({
    id: String(item.id ?? ""),
    backupId: String(item.backupId ?? ""),
    mode: String(item.mode ?? "drill"),
    status: String(item.status ?? "completed"),
    summary: item.summary == null ? null : String(item.summary),
    createdAt: String(item.createdAt ?? ""),
    completedAt: item.completedAt == null ? null : String(item.completedAt),
  })
}

async function listBackupRows(database: Kysely<unknown>) {
  const rows = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.databaseBackups)
    .selectAll()
    .orderBy("created_at", "desc")
    .execute()

  return rows.map((row) => mapBackupRow(row))
}

async function listRestoreRows(database: Kysely<unknown>) {
  const rows = await asQueryDatabase(database)
    .selectFrom(frameworkOperationsTableNames.databaseRestoreRuns)
    .selectAll()
    .orderBy("created_at", "desc")
    .execute()

  return rows.map((row) => mapRestoreRunRow(row))
}

async function insertBackupRow(database: Kysely<unknown>, item: ReturnType<typeof mapBackupRow>) {
  await asQueryDatabase(database)
    .insertInto(frameworkOperationsTableNames.databaseBackups)
    .values({
      id: item.id,
      file_name: item.fileName,
      file_path: item.filePath,
      driver: item.driver,
      status: item.status,
      trigger_kind: item.trigger,
      storage_target: item.storageTarget,
      google_drive_sync_status: item.googleDriveSyncStatus,
      google_drive_file_id: item.googleDriveFileId,
      size_bytes: item.sizeBytes,
      checksum: item.checksum,
      summary: item.summary,
      created_at: item.createdAt,
      completed_at: item.completedAt,
    })
    .execute()
}

async function updateBackupRow(database: Kysely<unknown>, item: ReturnType<typeof mapBackupRow>) {
  await asQueryDatabase(database)
    .updateTable(frameworkOperationsTableNames.databaseBackups)
    .set({
      status: item.status,
      storage_target: item.storageTarget,
      google_drive_sync_status: item.googleDriveSyncStatus,
      google_drive_file_id: item.googleDriveFileId,
      size_bytes: item.sizeBytes,
      checksum: item.checksum,
      summary: item.summary,
      completed_at: item.completedAt,
    })
    .where("id", "=", item.id)
    .execute()
}

async function insertRestoreRun(database: Kysely<unknown>, item: ReturnType<typeof mapRestoreRunRow>) {
  await asQueryDatabase(database)
    .insertInto(frameworkOperationsTableNames.databaseRestoreRuns)
    .values({
      id: item.id,
      backup_id: item.backupId,
      mode: item.mode,
      status: item.status,
      summary: item.summary,
      created_at: item.createdAt,
      completed_at: item.completedAt,
    })
    .execute()
}

async function updateRestoreRun(database: Kysely<unknown>, item: ReturnType<typeof mapRestoreRunRow>) {
  await asQueryDatabase(database)
    .updateTable(frameworkOperationsTableNames.databaseRestoreRuns)
    .set({
      status: item.status,
      summary: item.summary,
      completed_at: item.completedAt,
    })
    .where("id", "=", item.id)
    .execute()
}

function createUnsupportedBackupError(config: ServerConfig, context?: Record<string, unknown>) {
  const support = resolveBackupSupport(config)

  return new ApplicationError(
    support.reason,
    {
      driver: config.database.driver,
      ...context,
    },
    409
  )
}

export async function createDatabaseBackup(
  database: Kysely<unknown>,
  config: ServerConfig,
  options?: { trigger?: "manual" | "scheduled" | "restore-point" }
): Promise<DatabaseBackupRecord> {
  const backupRoot = resolveDatabaseBackupRoot(config)
  mkdirSync(backupRoot, { recursive: true })

  const createdAt = nowIso()
  const backupId = randomUUID()
  const fileName = `${createdAt.replace(/[:.]/g, "-")}-${config.database.driver}.backup`
  const filePath = path.join(backupRoot, fileName)
  let item = mapBackupRow({
    id: backupId,
    file_name: fileName,
    file_path: filePath,
    driver: config.database.driver,
    status: "pending",
    trigger_kind: options?.trigger ?? "manual",
    storage_target: "local",
    google_drive_sync_status: config.operations.backups.googleDrive.enabled
      ? "pending"
      : "not_configured",
    google_drive_file_id: null,
    size_bytes: 0,
    checksum: null,
    summary: null,
    created_at: createdAt,
    completed_at: null,
  })
  await insertBackupRow(database, item)

  try {
    throw createUnsupportedBackupError(config)
  } catch (error) {
    item = parseBackupItem({
      ...item,
      status: "failed",
      summary: error instanceof Error ? error.message : "Backup failed.",
      completedAt: nowIso(),
    })
    await updateBackupRow(database, item)
    throw error
  }
}

export async function listDatabaseBackupDashboard(
  database: Kysely<unknown>,
  config: ServerConfig
) {
  const support = resolveBackupSupport(config)
  const [backups, restoreRuns] = await Promise.all([
    listBackupRows(database),
    listRestoreRows(database),
  ])
  const latestDrill = restoreRuns.find((item) => item.mode === "drill" && item.status === "completed")

  return databaseBackupDashboardSchema.parse({
    support,
    backupDirectory: resolveDatabaseBackupRoot(config),
    scheduler: {
      enabled: config.operations.backups.enabled,
      cadenceHours: config.operations.backups.cadenceHours,
      maxBackups: config.operations.backups.maxBackups,
      lastVerifiedAt: latestDrill?.completedAt ?? config.operations.backups.lastVerifiedAt ?? null,
    },
    drive: {
      enabled: config.operations.backups.googleDrive.enabled,
      folderId: config.operations.backups.googleDrive.folderId ?? null,
      configured: Boolean(
        config.operations.backups.googleDrive.clientId &&
          config.operations.backups.googleDrive.clientSecret &&
          config.operations.backups.googleDrive.refreshToken &&
          config.operations.backups.googleDrive.folderId
      ),
    },
    latestBackup: backups[0] ?? null,
    backups,
    restoreRuns,
  })
}

export async function runDatabaseRestoreDrill(
  database: Kysely<unknown>,
  config: ServerConfig,
  backupId: string
): Promise<DatabaseRestoreRun> {
  const backups = await listBackupRows(database)
  const backup = backups.find((item) => item.id === backupId)

  if (!backup) {
    throw new ApplicationError("Database backup not found.", { backupId }, 404)
  }

  const run = mapRestoreRunRow({
    id: randomUUID(),
    backup_id: backupId,
    mode: "drill",
    status: "completed",
    summary: "Restore drill completed successfully.",
    created_at: nowIso(),
    completed_at: nowIso(),
  })

  const failed = parseRestoreRunItem({
    ...run,
    status: "failed",
    summary:
      "Automated backup and restore are not yet implemented for the remaining MariaDB/PostgreSQL-only runtime.",
    completedAt: nowIso(),
  })
  await insertRestoreRun(database, failed)
  throw createUnsupportedBackupError(config, { backupId: backup.id })
}

export async function restoreDatabaseBackup(
  databases: RuntimeDatabases,
  config: ServerConfig,
  backupId: string
): Promise<DatabaseRestoreRun> {
  const backupRows = await listBackupRows(databases.primary)
  const backup = backupRows.find((item) => item.id === backupId)

  if (!backup) {
    throw new ApplicationError("Database backup not found.", { backupId }, 404)
  }

  throw createUnsupportedBackupError(config, { backupId: backup.id })
}

export function startDatabaseBackupScheduler(input: {
  config: ServerConfig
  databases: RuntimeDatabases
  logger: RuntimeLogger
}) {
  const { config, databases, logger } = input
  const support = resolveBackupSupport(config)

  if (!config.operations.backups.enabled || !support.supported) {
    if (config.operations.backups.enabled && !support.supported) {
      logger.warn("operations.backup.scheduler_unsupported", {
        driver: config.database.driver,
        reason: support.reason,
      })
    }
    return () => undefined
  }

  let isRunning = false
  const cadenceMs = Math.max(1, config.operations.backups.cadenceHours) * 60 * 60 * 1000

  const runScheduledBackup = async () => {
    if (isRunning) {
      return
    }

    isRunning = true

    try {
      await createDatabaseBackup(databases.primary, config, {
        trigger: "scheduled",
      })
      logger.info("operations.backup.scheduled_completed")
    } catch (error) {
      logger.error("operations.backup.scheduled_failed", {
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      isRunning = false
    }
  }

  void runScheduledBackup()
  const timer = setInterval(() => {
    void runScheduledBackup()
  }, cadenceMs)

  return () => clearInterval(timer)
}
