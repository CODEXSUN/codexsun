import { randomUUID, createHash } from "node:crypto"
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import Database from "better-sqlite3"
import type { Kysely } from "kysely"

import {
  databaseBackupDashboardSchema,
  databaseBackupRecordSchema,
  databaseRestoreRunSchema,
} from "../../../shared/database-operations.js"
import type { ServerConfig } from "../config/server-config.js"
import { scheduleFallbackRestart } from "../config/runtime-restart.js"
import type { RuntimeDatabases } from "../database/client.js"
import { ApplicationError } from "../errors/application-error.js"
import { frameworkOperationsTableNames } from "./operations-table-names.js"

type DynamicDatabase = Record<string, Record<string, unknown>>
type RuntimeLogger = ReturnType<typeof import("../observability/runtime-logger.js").createRuntimeLogger>

function asQueryDatabase(database: Kysely<unknown>) {
  return database as unknown as Kysely<DynamicDatabase>
}

function operationsRoot(config: ServerConfig) {
  return path.resolve(config.webRoot, "..", "..", "..", "..")
}

export function resolveDatabaseBackupRoot(config: ServerConfig) {
  return path.resolve(operationsRoot(config), "storage", "backups", "database")
}

function sha256ForFile(filePath: string) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex")
}

function nowIso() {
  return new Date().toISOString()
}

function mapBackupRow(row: Record<string, unknown>) {
  return databaseBackupRecordSchema.parse({
    id: String(row.id ?? ""),
    fileName: String(row.file_name ?? ""),
    filePath: String(row.file_path ?? ""),
    driver: String(row.driver ?? "sqlite"),
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
    driver: String(item.driver ?? "sqlite"),
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

async function deleteBackupRow(database: Kysely<unknown>, backupId: string) {
  await asQueryDatabase(database)
    .deleteFrom(frameworkOperationsTableNames.databaseBackups)
    .where("id", "=", backupId)
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

async function maybeUploadToGoogleDrive(config: ServerConfig, backupPath: string) {
  const driveConfig = config.operations.backups.googleDrive

  if (!driveConfig.enabled) {
    return { status: "not_configured" as const, fileId: null }
  }

  if (
    !driveConfig.clientId ||
    !driveConfig.clientSecret ||
    !driveConfig.refreshToken ||
    !driveConfig.folderId
  ) {
    throw new ApplicationError(
      "Google Drive backup is enabled but required credentials are missing.",
      {},
      409
    )
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: driveConfig.clientId,
      client_secret: driveConfig.clientSecret,
      refresh_token: driveConfig.refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!tokenResponse.ok) {
    throw new ApplicationError("Unable to fetch Google Drive access token.", {}, 502)
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string }

  if (!tokenPayload.access_token) {
    throw new ApplicationError("Google Drive access token is missing.", {}, 502)
  }

  const metadata = {
    name: path.basename(backupPath),
    parents: [driveConfig.folderId],
  }
  const boundary = `codexsun-backup-${randomUUID()}`
  const fileContent = readFileSync(backupPath)
  const multipart = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
    ),
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`
    ),
    fileContent,
    Buffer.from(`\r\n--${boundary}--`),
  ])

  const uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenPayload.access_token}`,
        "content-type": `multipart/related; boundary=${boundary}`,
      },
      body: multipart,
    }
  )

  if (!uploadResponse.ok) {
    throw new ApplicationError("Unable to upload backup to Google Drive.", {}, 502)
  }

  const uploadPayload = (await uploadResponse.json()) as { id?: string }

  return {
    status: "uploaded" as const,
    fileId: uploadPayload.id ?? null,
  }
}

function createSqliteBackup(config: ServerConfig, targetPath: string) {
  copyFileSync(config.database.sqliteFile, targetPath)
}

function assertSqlitePrimary(config: ServerConfig) {
  if (config.database.driver !== "sqlite") {
    throw new ApplicationError(
      "Automated backup and restore are currently implemented for SQLite runtime only.",
      { driver: config.database.driver },
      409
    )
  }
}

async function pruneBackupFiles(database: Kysely<unknown>, config: ServerConfig) {
  const backups = await listBackupRows(database)
  const retained = backups
    .filter((item) => item.status === "completed")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const obsolete = retained.slice(config.operations.backups.maxBackups)

  for (const item of obsolete) {
    if (existsSync(item.filePath)) {
      rmSync(item.filePath, { force: true })
    }

    await deleteBackupRow(database, item.id)
  }
}

export async function createDatabaseBackup(
  database: Kysely<unknown>,
  config: ServerConfig,
  options?: { trigger?: "manual" | "scheduled" | "restore-point" }
) {
  assertSqlitePrimary(config)
  const backupRoot = resolveDatabaseBackupRoot(config)
  mkdirSync(backupRoot, { recursive: true })

  const createdAt = nowIso()
  const backupId = randomUUID()
  const fileName = `${createdAt.replace(/[:.]/g, "-")}-${config.database.driver}.sqlite`
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
    createSqliteBackup(config, filePath)
    const stats = statSync(filePath)
    const driveResult = await maybeUploadToGoogleDrive(config, filePath).catch((error) => {
      item = parseBackupItem({
        ...item,
        googleDriveSyncStatus: "failed",
        summary: error instanceof Error ? error.message : "Google Drive upload failed.",
      })
      return { status: "failed" as const, fileId: null }
    })
    item = parseBackupItem({
      ...item,
      status: "completed",
      storageTarget: driveResult.status === "uploaded" ? "google_drive" : "local",
      googleDriveSyncStatus:
        driveResult.status === "uploaded"
          ? "uploaded"
          : item.googleDriveSyncStatus,
      googleDriveFileId: driveResult.fileId,
      sizeBytes: Number(stats.size),
      checksum: sha256ForFile(filePath),
      summary:
        driveResult.status === "uploaded"
          ? "Backup created and uploaded to Google Drive."
          : "Backup created successfully.",
      completedAt: nowIso(),
    })
    await updateBackupRow(database, item)
    await pruneBackupFiles(database, config)
    return item
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
  const [backups, restoreRuns] = await Promise.all([
    listBackupRows(database),
    listRestoreRows(database),
  ])
  const latestDrill = restoreRuns.find((item) => item.mode === "drill" && item.status === "completed")

  return databaseBackupDashboardSchema.parse({
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
) {
  assertSqlitePrimary(config)
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

  const tempDir = mkdtempSync(path.join(tmpdir(), "codexsun-restore-drill-"))
  const tempDbPath = path.join(tempDir, path.basename(backup.filePath))

  try {
    copyFileSync(backup.filePath, tempDbPath)
    const drillDb = new Database(tempDbPath, { readonly: true })
    drillDb.prepare("select 1 as ok").get()
    drillDb.close()
    await insertRestoreRun(database, run)
    return run
  } catch (error) {
    const failed = parseRestoreRunItem({
      ...run,
      status: "failed",
      summary: error instanceof Error ? error.message : "Restore drill failed.",
      completedAt: nowIso(),
    })
    await insertRestoreRun(database, failed)
    throw error
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

export async function restoreDatabaseBackup(
  databases: RuntimeDatabases,
  config: ServerConfig,
  backupId: string
) {
  assertSqlitePrimary(config)
  const backupRows = await listBackupRows(databases.primary)
  const backup = backupRows.find((item) => item.id === backupId)

  if (!backup) {
    throw new ApplicationError("Database backup not found.", { backupId }, 404)
  }

  const restorePoint = await createDatabaseBackup(databases.primary, config, {
    trigger: "restore-point",
  })
  const run = mapRestoreRunRow({
    id: randomUUID(),
    backup_id: backupId,
    mode: "live",
    status: "scheduled_restart",
    summary: `Restore scheduled from backup ${backup.fileName}. Pre-restore backup ${restorePoint.fileName} created.`,
    created_at: nowIso(),
    completed_at: nowIso(),
  })
  await insertRestoreRun(databases.primary, run)

  await databases.destroy()
  copyFileSync(backup.filePath, config.database.sqliteFile)
  scheduleFallbackRestart()

  return run
}

export function startDatabaseBackupScheduler(input: {
  config: ServerConfig
  databases: RuntimeDatabases
  logger: RuntimeLogger
}) {
  const { config, databases, logger } = input

  if (!config.operations.backups.enabled) {
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
