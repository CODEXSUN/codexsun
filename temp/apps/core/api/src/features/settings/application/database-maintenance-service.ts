import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { RowDataPacket } from 'mysql2/promise'
import {
  databaseBackupDeleteResponseSchema,
  databaseBackupResponseSchema,
  databaseBackupUploadPayloadSchema,
  databaseBackupUploadResponseSchema,
  databaseHardResetPayloadSchema,
  databaseManagerActionResponseSchema,
  databaseManagerResponseSchema,
  databaseRestoreJobResultSchema,
  databaseRestoreJobSchema,
  databaseRestorePayloadSchema,
  databaseRestoreResponseSchema,
  type AuthUser,
  type DatabaseManagerReport,
  type DatabaseManagerTable,
  type DatabaseRestoreJob,
  type DatabaseRestoreMode,
  type DatabaseVerificationSummary,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import { environment } from '@framework-core/runtime/config/environment'
import { ensureConfiguredDatabaseConnection, initializeApplicationSetup } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { runMigrations } from '@framework-core/runtime/database/migrator'
import { sendSmtpMail } from '@framework-core/runtime/notifications/smtp-mailer'
import {
  authTableNames,
  commerceTableNames,
  commonTableNames,
  companyTableNames,
  contactTableNames,
  customerTableNames,
  mailboxTableNames,
  mediaTableNames,
  migrationTableName,
  productTableNames,
  seederTableName,
  storefrontTableNames,
} from '@framework-core/runtime/database/table-names'
import { getSystemVersion } from '@framework-core/runtime/version/system-version'

interface ExistingTableRow extends RowDataPacket {
  tableName: string
}

interface ColumnCountRow extends RowDataPacket {
  tableName: string
  columnCount: number
}

interface CountRow extends RowDataPacket {
  totalCount: number
}

interface CreateTableRow extends RowDataPacket {
  Table?: string
  ['Create Table']?: string
}

interface ColumnTypeRow extends RowDataPacket {
  columnName: string
  dataType: string
}

interface BackupFilePayload {
  generatedAt?: string
  databaseName?: string
  tableCount?: number
  tables?: Array<{
    name?: string
    createStatement?: string
    rows?: Array<Record<string, unknown>>
  }>
}

interface RestorableBackupTable {
  name: string
  createStatement: string
  rows: Array<Record<string, unknown>>
}

interface RestoreExecutionSummary {
  mode: DatabaseRestoreMode
  tablesProcessed: number
  rowsInserted: number
  rowsSkipped: number
  chunksExecuted: number
}

interface RestoreJobProgressState {
  completedUnits: number
  totalUnits: number
}

const hardResetConfirmation = 'RESET CODEXSUN DATABASE'
const backupDownloadBasePath = '/admin/database-manager/backups'
const manualBackupPrefix = 'codexsun-database-backup'
const scheduledBackupPrefix = 'codexsun-database-backup-auto'
const safetyBackupPrefix = 'codexsun-database-backup-safety'
const restoreChunkSize = 25
const dateColumnTypes = new Set(['date'])
const dateTimeColumnTypes = new Set(['datetime', 'timestamp'])
const timeColumnTypes = new Set(['time'])
const yearColumnTypes = new Set(['year'])
let automatedBackupTimer: NodeJS.Timeout | null = null
let automatedBackupRunning = false
const restoreJobs = new Map<string, DatabaseRestoreJob>()
let activeRestoreJobId: string | null = null

function assertSuperAdmin(user: AuthUser) {
  if (!user.isSuperAdmin) {
    throw new ApplicationError('Super admin access is required.', {}, 403)
  }
}

function quoteIdentifier(value: string) {
  return '`' + value.replaceAll('`', '``') + '`'
}

function buildExpectedTableCategories() {
  return new Map<string, string>([
    [migrationTableName, 'system'],
    [seederTableName, 'system'],
    ...Object.values(authTableNames).map((tableName) => [tableName, 'auth'] as const),
    ...Object.values(commonTableNames).map((tableName) => [tableName, 'common'] as const),
    ...Object.values(companyTableNames).map((tableName) => [tableName, 'company'] as const),
    ...Object.values(contactTableNames).map((tableName) => [tableName, 'contact'] as const),
    ...Object.values(productTableNames).map((tableName) => [tableName, 'product'] as const),
    ...Object.values(mediaTableNames).map((tableName) => [tableName, 'media'] as const),
    ...Object.values(storefrontTableNames).map((tableName) => [tableName, 'storefront'] as const),
    ...Object.values(customerTableNames).map((tableName) => [tableName, 'customer'] as const),
    ...Object.values(commerceTableNames).map((tableName) => [tableName, 'commerce'] as const),
    ...Object.values(mailboxTableNames).map((tableName) => [tableName, 'mailbox'] as const),
  ])
}

const expectedTableCategories = buildExpectedTableCategories()
const expectedTableNames = Array.from(expectedTableCategories.keys()).sort((left, right) => left.localeCompare(right))

function ensureDatabaseReady() {
  if (!environment.database.enabled) {
    throw new ApplicationError('Database integration is disabled.', {}, 409)
  }
}

async function readExistingTableNames() {
  const rows = await db.query<ExistingTableRow>(
    `
      SELECT TABLE_NAME AS tableName
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `,
  )

  return rows.map((row) => row.tableName)
}

async function readColumnCounts() {
  const rows = await db.query<ColumnCountRow>(
    `
      SELECT TABLE_NAME AS tableName, COUNT(*) AS columnCount
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      GROUP BY TABLE_NAME
    `,
  )

  return new Map(rows.map((row) => [row.tableName, Number(row.columnCount ?? 0)]))
}

async function readTableColumnTypes(tableName: string) {
  const rows = await db.query<ColumnTypeRow>(
    `
      SELECT COLUMN_NAME AS columnName, DATA_TYPE AS dataType
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [tableName],
  )

  return new Map(rows.map((row) => [row.columnName, row.dataType.toLowerCase()]))
}

async function readExactRowCount(tableName: string) {
  const rows = await db.query<CountRow>(
    `SELECT COUNT(*) AS totalCount FROM ${quoteIdentifier(tableName)}`,
  )

  return Number(rows[0]?.totalCount ?? 0)
}

function resolveVerificationStatus(
  databaseStatus: DatabaseManagerReport['database']['status'],
  missingTableCount: number,
  unexpectedTableCount: number,
  pendingMigrations: number,
): DatabaseVerificationSummary['status'] {
  if (databaseStatus === 'disabled') {
    return 'disabled'
  }

  if (databaseStatus === 'error') {
    return 'error'
  }

  if (missingTableCount > 0 || unexpectedTableCount > 0 || pendingMigrations > 0) {
    return 'warning'
  }

  return 'ready'
}

function buildVerificationDetail(
  missingTableCount: number,
  unexpectedTableCount: number,
  pendingMigrations: number,
) {
  const parts: string[] = []

  if (pendingMigrations > 0) {
    parts.push(`${pendingMigrations} migration(s) pending`)
  }

  if (missingTableCount > 0) {
    parts.push(`${missingTableCount} expected table(s) missing`)
  }

  if (unexpectedTableCount > 0) {
    parts.push(`${unexpectedTableCount} unexpected table(s) present`)
  }

  if (parts.length === 0) {
    return 'Schema verification passed. All expected tables are present and the migration tracker is current.'
  }

  return `${parts.join(', ')}.`
}

function getBackupDirectoryPath() {
  return path.join(environment.media.storageRoot, 'backups', 'database')
}

function ensureBackupDirectory() {
  fs.mkdirSync(getBackupDirectoryPath(), { recursive: true })
}

function buildBackupSummary(fileName: string) {
  const absolutePath = resolveBackupFilePath(fileName)

  if (!fs.existsSync(absolutePath)) {
    return null
  }

  const stats = fs.statSync(absolutePath)

  return {
    fileName,
    createdAt: stats.mtime.toISOString(),
    byteSize: stats.size,
    downloadPath: `${backupDownloadBasePath}/${fileName}`,
  }
}

function readLatestBackupSummary() {
  const backups = readAvailableBackupSummaries()
  return backups[0] ?? null
}

function readAvailableBackupSummaries() {
  ensureBackupDirectory()
  return fs.readdirSync(getBackupDirectoryPath(), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left))
    .map((fileName) => buildBackupSummary(fileName))
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
}

export function resolveBackupFilePath(fileName: string) {
  if (!/^[A-Za-z0-9._-]+$/.test(fileName)) {
    throw new ApplicationError('Invalid backup file name.', { fileName }, 400)
  }

  return path.join(getBackupDirectoryPath(), fileName)
}

function deleteBackupFile(fileName: string) {
  const absolutePath = resolveBackupFilePath(fileName)

  if (!fs.existsSync(absolutePath)) {
    throw new ApplicationError('Backup file was not found.', { fileName }, 404)
  }

  fs.rmSync(absolutePath)
}

async function buildDatabaseReport(): Promise<DatabaseManagerReport> {
  const versionResponse = await getSystemVersion()
  const version = versionResponse.version
  const latestBackup = readLatestBackupSummary()
  const availableBackups = readAvailableBackupSummaries()

  if (version.database.status !== 'ready') {
    return databaseManagerResponseSchema.parse({
      report: {
        database: version.database,
        verification: {
          status: version.database.status === 'disabled' ? 'disabled' : 'error',
          checkedAt: version.database.checkedAt,
          detail: version.database.detail,
          expectedTableCount: expectedTableNames.length,
          existingTableCount: 0,
          existingManagedTableCount: 0,
          missingTableCount: expectedTableNames.length,
          unexpectedTableCount: 0,
          totalRowCount: 0,
        },
        tables: expectedTableNames.map((tableName) => ({
          name: tableName,
          category: expectedTableCategories.get(tableName) ?? 'unknown',
          exists: false,
          expected: true,
          status: 'missing',
          rowCount: null,
          columnCount: null,
        })),
        latestBackup,
        availableBackups,
      },
    }).report
  }

  const existingTableNames = await readExistingTableNames()
  const existingTableNameSet = new Set(existingTableNames)
  const columnCounts = await readColumnCounts()
  const tables: DatabaseManagerTable[] = []
  let totalRowCount = 0

  for (const tableName of expectedTableNames) {
    if (!existingTableNameSet.has(tableName)) {
      tables.push({
        name: tableName,
        category: expectedTableCategories.get(tableName) ?? 'unknown',
        exists: false,
        expected: true,
        status: 'missing',
        rowCount: null,
        columnCount: null,
      })
      continue
    }

    const rowCount = await readExactRowCount(tableName)
    totalRowCount += rowCount
    tables.push({
      name: tableName,
      category: expectedTableCategories.get(tableName) ?? 'unknown',
      exists: true,
      expected: true,
      status: 'ok',
      rowCount,
      columnCount: columnCounts.get(tableName) ?? 0,
    })
  }

  for (const tableName of existingTableNames) {
    if (expectedTableCategories.has(tableName)) {
      continue
    }

    const rowCount = await readExactRowCount(tableName)
    totalRowCount += rowCount
    tables.push({
      name: tableName,
      category: 'unexpected',
      exists: true,
      expected: false,
      status: 'unexpected',
      rowCount,
      columnCount: columnCounts.get(tableName) ?? 0,
    })
  }

  tables.sort((left, right) => {
    if (left.status !== right.status) {
      return left.status.localeCompare(right.status)
    }

    if (left.category !== right.category) {
      return left.category.localeCompare(right.category)
    }

    return left.name.localeCompare(right.name)
  })

  const missingTableCount = tables.filter((table) => table.status === 'missing').length
  const unexpectedTableCount = tables.filter((table) => table.status === 'unexpected').length
  const existingManagedTableCount = tables.filter((table) => table.expected && table.exists).length

  return databaseManagerResponseSchema.parse({
    report: {
      database: version.database,
      verification: {
        status: resolveVerificationStatus(
          version.database.status,
          missingTableCount,
          unexpectedTableCount,
          version.database.pendingMigrations,
        ),
        checkedAt: new Date().toISOString(),
        detail: buildVerificationDetail(
          missingTableCount,
          unexpectedTableCount,
          version.database.pendingMigrations,
        ),
        expectedTableCount: expectedTableNames.length,
        existingTableCount: existingTableNames.length,
        existingManagedTableCount,
        missingTableCount,
        unexpectedTableCount,
        totalRowCount,
      },
      tables,
      latestBackup,
      availableBackups,
    },
  }).report
}

async function createDatabaseBackupFile(filePrefix = manualBackupPrefix) {
  ensureDatabaseReady()
  await ensureConfiguredDatabaseConnection()
  ensureBackupDirectory()

  const existingTableNames = await readExistingTableNames()
  const backupTables = []

  for (const tableName of existingTableNames) {
    const createRows = await db.query<CreateTableRow>(`SHOW CREATE TABLE ${quoteIdentifier(tableName)}`)
    const dataRows = await db.query<RowDataPacket>(`SELECT * FROM ${quoteIdentifier(tableName)}`)

    backupTables.push({
      name: tableName,
      rowCount: dataRows.length,
      createStatement: String(createRows[0]?.['Create Table'] ?? ''),
      rows: dataRows,
    })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${filePrefix}-${timestamp}.json`
  const payload = {
    generatedAt: new Date().toISOString(),
    databaseName: environment.database.name,
    tableCount: backupTables.length,
    tables: backupTables,
  }

  fs.writeFileSync(resolveBackupFilePath(fileName), JSON.stringify(payload, null, 2), 'utf8')

  return buildBackupSummary(fileName)
}

function parseBackupFile(fileName: string) {
  const absolutePath = resolveBackupFilePath(fileName)

  if (!fs.existsSync(absolutePath)) {
    throw new ApplicationError('Backup file was not found.', { fileName }, 404)
  }

  let parsedPayload: BackupFilePayload

  try {
    parsedPayload = JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as BackupFilePayload
  } catch {
    throw new ApplicationError('Backup file is not valid JSON.', { fileName }, 400)
  }

  if (!Array.isArray(parsedPayload.tables) || parsedPayload.tables.length === 0) {
    throw new ApplicationError('Backup file does not contain any restorable tables.', { fileName }, 400)
  }

  return parsedPayload.tables.map((table) => {
    if (
      !table
      || typeof table.name !== 'string'
      || !table.name.trim()
      || typeof table.createStatement !== 'string'
      || !table.createStatement.trim()
      || !Array.isArray(table.rows)
    ) {
      throw new ApplicationError('Backup file format is invalid.', { fileName }, 400)
    }

    return {
      name: table.name,
      createStatement: table.createStatement,
      rows: table.rows,
    } satisfies RestorableBackupTable
  })
}

function parseBackupContent(content: string, fileName = 'uploaded-backup.json') {
  let parsedPayload: BackupFilePayload

  try {
    parsedPayload = JSON.parse(content) as BackupFilePayload
  } catch {
    throw new ApplicationError('Backup file is not valid JSON.', { fileName }, 400)
  }

  if (!Array.isArray(parsedPayload.tables) || parsedPayload.tables.length === 0) {
    throw new ApplicationError('Backup file does not contain any restorable tables.', { fileName }, 400)
  }

  for (const table of parsedPayload.tables) {
    if (
      !table
      || typeof table.name !== 'string'
      || !table.name.trim()
      || typeof table.createStatement !== 'string'
      || !table.createStatement.trim()
      || !Array.isArray(table.rows)
    ) {
      throw new ApplicationError('Backup file format is invalid.', { fileName }, 400)
    }
  }
}

function normalizeUploadedBackupFileName(fileName: string) {
  const trimmed = fileName.trim()
  const sanitized = trimmed.replace(/[^A-Za-z0-9._-]/g, '-')
  const withExtension = sanitized.toLowerCase().endsWith('.json') ? sanitized : `${sanitized}.json`

  if (!withExtension || withExtension === '.json') {
    throw new ApplicationError('Enter a valid backup file name.', { fileName }, 400)
  }

  return withExtension
}

function saveBackupFile(input: { fileName: string; content: string }) {
  parseBackupContent(input.content, input.fileName)

  const normalizedFileName = normalizeUploadedBackupFileName(input.fileName)
  const absolutePath = resolveBackupFilePath(normalizedFileName)
  try {
    ensureBackupDirectory()
    fs.writeFileSync(absolutePath, input.content, 'utf8')
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    throw new ApplicationError('Uploaded backup could not be saved.', {
      fileName: normalizedFileName,
      backupDirectory: getBackupDirectoryPath(),
      fsCode: nodeError.code ?? 'UNKNOWN',
      fsMessage: nodeError.message,
    }, 500)
  }

  const backup = buildBackupSummary(normalizedFileName)
  if (!backup) {
    throw new ApplicationError('Uploaded backup could not be saved.', { fileName: normalizedFileName }, 500)
  }

  return backup
}

async function dropManagedTables() {
  const existingTableNames = new Set(await readExistingTableNames())
  const managedExistingTables = expectedTableNames.filter((tableName) => existingTableNames.has(tableName))

  if (managedExistingTables.length === 0) {
    return
  }

  await db.execute('SET FOREIGN_KEY_CHECKS = 0')

  try {
    for (const tableName of managedExistingTables) {
      await db.execute(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)}`)
    }
  } finally {
    await db.execute('SET FOREIGN_KEY_CHECKS = 1')
  }
}

async function dropAllTables() {
  const existingTableNames = await readExistingTableNames()

  if (existingTableNames.length === 0) {
    return
  }

  for (const tableName of existingTableNames) {
    await db.execute(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)}`)
  }
}

async function tableExists(tableName: string) {
  return (await readExistingTableNames()).includes(tableName)
}

function formatUtcDate(value: Date) {
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, '0'),
    String(value.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

function formatUtcTime(value: Date) {
  return [
    String(value.getUTCHours()).padStart(2, '0'),
    String(value.getUTCMinutes()).padStart(2, '0'),
    String(value.getUTCSeconds()).padStart(2, '0'),
  ].join(':')
}

function formatUtcDateTime(value: Date) {
  return `${formatUtcDate(value)} ${formatUtcTime(value)}`
}

function normalizeBackupValue(value: unknown, columnType: string | undefined) {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (value instanceof Date) {
    if (columnType && dateColumnTypes.has(columnType)) {
      return formatUtcDate(value)
    }

    if (columnType && timeColumnTypes.has(columnType)) {
      return formatUtcTime(value)
    }

    return formatUtcDateTime(value)
  }

  if (typeof value === 'string') {
    const parsedDate = value.includes('T') ? new Date(value) : null
    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      if (columnType && dateColumnTypes.has(columnType)) {
        return formatUtcDate(parsedDate)
      }

      if (columnType && dateTimeColumnTypes.has(columnType)) {
        return formatUtcDateTime(parsedDate)
      }

      if (columnType && timeColumnTypes.has(columnType)) {
        return formatUtcTime(parsedDate)
      }

      if (columnType && yearColumnTypes.has(columnType)) {
        return String(parsedDate.getUTCFullYear())
      }
    }

    return value
  }

  if (
    value
    && typeof value === 'object'
    && 'type' in value
    && value.type === 'Buffer'
    && 'data' in value
    && Array.isArray(value.data)
  ) {
    return Buffer.from(value.data)
  }

  return JSON.stringify(value)
}

function readPersistenceDetail(error: unknown) {
  if (error && typeof error === 'object' && 'sqlMessage' in error) {
    const detail = (error as { sqlMessage?: unknown }).sqlMessage
    if (typeof detail === 'string') {
      return detail
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown database error'
}

function throwRestoreError(message: string, context: Record<string, unknown>, error: unknown): never {
  throw new ApplicationError(message, {
    ...context,
    detail: readPersistenceDetail(error),
  }, 500)
}

async function createMissingTableFromBackup(table: RestorableBackupTable) {
  try {
    await db.execute(table.createStatement)
  } catch (error) {
    throwRestoreError('Failed to create table during restore.', { tableName: table.name }, error)
  }
}

async function insertBackupRows(
  tableName: string,
  rows: Array<Record<string, unknown>>,
  mode: DatabaseRestoreMode,
  onChunkComplete?: (chunkIndex: number, chunkCount: number) => void,
) {
  const columnTypes = await readTableColumnTypes(tableName)
  let rowsInserted = 0
  let rowsSkipped = 0
  let chunksExecuted = 0
  const chunkCount = rows.length === 0 ? 0 : Math.ceil(rows.length / restoreChunkSize)

  for (let chunkStart = 0; chunkStart < rows.length; chunkStart += restoreChunkSize) {
    const chunk = rows.slice(chunkStart, chunkStart + restoreChunkSize)
    chunksExecuted += 1

    for (let rowOffset = 0; rowOffset < chunk.length; rowOffset += 1) {
      const row = chunk[rowOffset]
      const columns = Object.keys(row)

      if (columns.length === 0) {
        continue
      }

      const placeholders = columns.map(() => '?').join(', ')
      const insertKeyword = mode === 'incremental' ? 'INSERT IGNORE' : 'INSERT'

      try {
        const result = await db.execute(
          `${insertKeyword} INTO ${quoteIdentifier(tableName)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${placeholders})`,
          columns.map((column) => normalizeBackupValue(row[column], columnTypes.get(column))),
        )
        if (mode === 'incremental' && Number(result.affectedRows ?? 0) === 0) {
          rowsSkipped += 1
          continue
        }

        rowsInserted += 1
      } catch (error) {
        throwRestoreError('Failed to restore table row.', {
          tableName,
          mode,
          rowNumber: chunkStart + rowOffset + 1,
        }, error)
      }
    }

    onChunkComplete?.(chunksExecuted, chunkCount)
  }

  return {
    rowsInserted,
    rowsSkipped,
    chunksExecuted,
  }
}

async function sendBackupByEmail(fileName: string, fileBuffer: Buffer) {
  if (!environment.notifications.email.enabled || environment.runtime.backups.emailRecipients.length === 0) {
    return
  }

  await sendSmtpMail({
    to: environment.runtime.backups.emailRecipients.map((email) => ({ email })),
    subject: `codexsun automated database backup ${fileName}`,
    text: `The automated codexsun database backup is attached.\n\nFile: ${fileName}`,
    attachments: [{
      filename: fileName,
      content: fileBuffer,
      contentType: 'application/json',
    }],
  })
}

async function requestGoogleDriveAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: environment.runtime.backups.googleDrive.clientId,
      client_secret: environment.runtime.backups.googleDrive.clientSecret,
      refresh_token: environment.runtime.backups.googleDrive.refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  const payload = await response.json().catch(() => null) as { access_token?: string; error_description?: string } | null

  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description ?? 'Unable to get Google Drive access token.')
  }

  return payload.access_token
}

async function uploadBackupToGoogleDrive(fileName: string, fileBuffer: Buffer) {
  if (!environment.runtime.backups.googleDrive.enabled) {
    return
  }

  const accessToken = await requestGoogleDriveAccessToken()
  const boundary = `codexsun-backup-${Date.now()}`
  const metadata = JSON.stringify({
    name: fileName,
    ...(environment.runtime.backups.googleDrive.folderId
      ? { parents: [environment.runtime.backups.googleDrive.folderId] }
      : {}),
  })
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || 'Google Drive upload failed.')
  }
}

async function deliverBackupExternally(fileName: string) {
  const fileBuffer = fs.readFileSync(resolveBackupFilePath(fileName))
  const deliveryErrors: string[] = []

  try {
    await sendBackupByEmail(fileName, fileBuffer)
  } catch (error) {
    deliveryErrors.push(`email: ${readPersistenceDetail(error)}`)
  }

  try {
    await uploadBackupToGoogleDrive(fileName, fileBuffer)
  } catch (error) {
    deliveryErrors.push(`google-drive: ${readPersistenceDetail(error)}`)
  }

  if (deliveryErrors.length > 0) {
    throw new ApplicationError('Automated backup delivery failed.', {
      detail: deliveryErrors.join(' | '),
    }, 502)
  }
}

function createRestoreJobState(input: {
  fileName: string
  mode: DatabaseRestoreMode
  status: DatabaseRestoreJob['status']
  step: string
  progress: number
}): DatabaseRestoreJob {
  const timestamp = new Date().toISOString()
  return databaseRestoreJobSchema.parse({
    jobId: randomUUID(),
    fileName: input.fileName,
    mode: input.mode,
    status: input.status,
    progress: input.progress,
    step: input.step,
    startedAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    result: null,
    errorMessage: null,
    errorContext: null,
  })
}

function updateRestoreJob(jobId: string, updater: (current: DatabaseRestoreJob) => DatabaseRestoreJob) {
  const current = restoreJobs.get(jobId)
  if (!current) {
    return null
  }

  const nextJob = databaseRestoreJobSchema.parse(updater(current))
  restoreJobs.set(jobId, nextJob)
  return nextJob
}

function setRestoreJobStep(jobId: string, step: string, progress: number) {
  return updateRestoreJob(jobId, (current) => ({
    ...current,
    step,
    progress: Math.min(100, Math.max(0, Math.trunc(progress))),
    updatedAt: new Date().toISOString(),
  }))
}

function completeRestoreJob(jobId: string, result: DatabaseRestoreJob['result']) {
  return updateRestoreJob(jobId, (current) => ({
    ...current,
    status: 'completed',
    progress: 100,
    step: 'Restore completed.',
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: result ? databaseRestoreJobResultSchema.parse(result) : null,
    errorMessage: null,
    errorContext: null,
  }))
}

function failRestoreJob(jobId: string, error: unknown) {
  const message = error instanceof ApplicationError
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Restore failed.'
  const context = error instanceof ApplicationError ? error.context : null

  return updateRestoreJob(jobId, (current) => ({
    ...current,
    status: 'failed',
    step: message,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    errorMessage: message,
    errorContext: context,
  }))
}

function readRestoreJob(jobId: string) {
  const job = restoreJobs.get(jobId)
  if (!job) {
    throw new ApplicationError('Restore job was not found.', { jobId }, 404)
  }

  return job
}

async function createSafetyBackup() {
  return createDatabaseBackupFile(safetyBackupPrefix)
}

function calculateRestoreProgress(totalUnits: number, completedUnits: number) {
  if (totalUnits <= 0) {
    return 0
  }

  return Math.min(99, Math.round((completedUnits / totalUnits) * 100))
}

async function restoreDatabaseBackupFile(jobId: string, fileName: string, mode: DatabaseRestoreMode) {
  ensureDatabaseReady()
  await ensureConfiguredDatabaseConnection()

  const tables = parseBackupFile(fileName)
  const tableChunkCount = tables.reduce(
    (total, table) => total + (table.rows.length === 0 ? 0 : Math.ceil(table.rows.length / restoreChunkSize)),
    0,
  )
  const totalUnits = 3 + (tables.length * 2) + tableChunkCount + (mode === 'fresh' ? 1 : 0)
  const progressState: RestoreJobProgressState = {
    completedUnits: 0,
    totalUnits,
  }
  const summary: RestoreExecutionSummary = {
    mode,
    tablesProcessed: 0,
    rowsInserted: 0,
    rowsSkipped: 0,
    chunksExecuted: 0,
  }

  const reportProgress = (step: string, units = 1) => {
    progressState.completedUnits += units
    setRestoreJobStep(
      jobId,
      step,
      calculateRestoreProgress(progressState.totalUnits, progressState.completedUnits),
    )
  }

  reportProgress('Restore job started.', 0)
  setRestoreJobStep(jobId, 'Creating safety backup.', calculateRestoreProgress(progressState.totalUnits, progressState.completedUnits))
  const safetyBackup = await createSafetyBackup()
  reportProgress('Safety backup created.')

  if (!safetyBackup) {
    throw new ApplicationError('Unable to create a safety backup before restore.', {}, 500)
  }

  await db.execute('SET FOREIGN_KEY_CHECKS = 0')

  try {
    if (mode === 'fresh') {
      setRestoreJobStep(jobId, 'Dropping existing tables.', calculateRestoreProgress(progressState.totalUnits, progressState.completedUnits))
      await dropAllTables()
      reportProgress('Existing tables removed.')
    }

    for (const table of tables) {
      if (mode === 'fresh' || !(await tableExists(table.name))) {
        setRestoreJobStep(jobId, `Creating ${table.name}.`, calculateRestoreProgress(progressState.totalUnits, progressState.completedUnits))
        await createMissingTableFromBackup(table)
      }
      reportProgress(`Created ${table.name}.`)
    }

    for (const table of tables) {
      setRestoreJobStep(jobId, `Restoring rows for ${table.name}.`, calculateRestoreProgress(progressState.totalUnits, progressState.completedUnits))
      const tableSummary = await insertBackupRows(
        table.name,
        table.rows,
        mode,
        (chunkIndex, chunkCount) => {
          setRestoreJobStep(
            jobId,
            `Restoring ${table.name} chunk ${chunkIndex}/${chunkCount}.`,
            calculateRestoreProgress(progressState.totalUnits, progressState.completedUnits),
          )
          reportProgress(`Restored chunk ${chunkIndex}/${chunkCount} for ${table.name}.`)
        },
      )
      summary.tablesProcessed += 1
      summary.rowsInserted += tableSummary.rowsInserted
      summary.rowsSkipped += tableSummary.rowsSkipped
      summary.chunksExecuted += tableSummary.chunksExecuted
      reportProgress(`Restored ${table.name}.`)
    }
  } finally {
    await db.execute('SET FOREIGN_KEY_CHECKS = 1')
  }

  setRestoreJobStep(jobId, 'Refreshing application setup.', calculateRestoreProgress(progressState.totalUnits, progressState.completedUnits))
  await initializeApplicationSetup(true)
  reportProgress('Application setup refreshed.')

  const restoredBackup = buildBackupSummary(fileName)
  if (!restoredBackup) {
    throw new ApplicationError('Restored backup metadata is unavailable.', { fileName }, 500)
  }

  const result = {
    message: mode === 'incremental'
      ? 'Backup restored in incremental mode and setup state refreshed.'
      : 'Backup restored in fresh mode and setup state refreshed.',
    restoredBackup,
    safetyBackup,
    summary,
    report: await buildDatabaseReport(),
  } satisfies DatabaseRestoreJob['result']

  completeRestoreJob(jobId, result)
  return result
}

async function startRestoreJob(fileName: string, mode: DatabaseRestoreMode) {
  if (activeRestoreJobId) {
    throw new ApplicationError('A restore job is already running.', { jobId: activeRestoreJobId }, 409)
  }

  parseBackupFile(fileName)

  const job = createRestoreJobState({
    fileName,
    mode,
    status: 'queued',
    step: 'Restore job queued.',
    progress: 0,
  })

  activeRestoreJobId = job.jobId
  restoreJobs.set(job.jobId, job)

  void (async () => {
    try {
      updateRestoreJob(job.jobId, (current) => ({
        ...current,
        status: 'running',
        step: 'Preparing restore job.',
        updatedAt: new Date().toISOString(),
      }))

      await restoreDatabaseBackupFile(job.jobId, fileName, mode)
    } catch (error) {
      failRestoreJob(job.jobId, error)
    } finally {
      activeRestoreJobId = null
    }
  })()

  return readRestoreJob(job.jobId)
}

function buildRestoreJobStatus(jobId: string) {
  return databaseRestoreJobSchema.parse(readRestoreJob(jobId))
}

export async function readDatabaseManager(user: AuthUser) {
  assertSuperAdmin(user)
  return databaseManagerResponseSchema.parse({
    report: await buildDatabaseReport(),
  })
}

export async function verifyDatabaseManager(user: AuthUser) {
  assertSuperAdmin(user)

  return databaseManagerActionResponseSchema.parse({
    message: 'Database verification finished.',
    report: await buildDatabaseReport(),
  })
}

export async function migrateDatabaseToLatest(user: AuthUser) {
  assertSuperAdmin(user)
  ensureDatabaseReady()
  await ensureConfiguredDatabaseConnection({ createDatabaseIfMissing: true })
  await runMigrations()
  await initializeApplicationSetup(true)

  return databaseManagerActionResponseSchema.parse({
    message: 'Database migrations and seeders were applied up to the latest known version.',
    report: await buildDatabaseReport(),
  })
}

export async function backupDatabase(user: AuthUser) {
  assertSuperAdmin(user)
  const backup = await createDatabaseBackupFile(manualBackupPrefix)

  if (!backup) {
    throw new ApplicationError('Backup generation failed.', {}, 500)
  }

  return databaseBackupResponseSchema.parse({
    message: 'Database backup created.',
    backup,
    report: await buildDatabaseReport(),
  })
}

export async function uploadDatabaseBackup(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = databaseBackupUploadPayloadSchema.parse(payload)
  const backup = saveBackupFile({
    fileName: parsedPayload.fileName,
    content: parsedPayload.content,
  })

  return databaseBackupUploadResponseSchema.parse({
    message: 'Backup file uploaded to server storage.',
    backup,
    report: await buildDatabaseReport(),
  })
}

export async function deleteDatabaseBackup(user: AuthUser, fileName: string) {
  assertSuperAdmin(user)
  deleteBackupFile(fileName)

  return databaseBackupDeleteResponseSchema.parse({
    message: 'Backup file deleted from server storage.',
    deletedFileName: fileName,
    report: await buildDatabaseReport(),
  })
}

export async function hardResetDatabase(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)
  ensureDatabaseReady()
  await ensureConfiguredDatabaseConnection({ createDatabaseIfMissing: true })

  const parsedPayload = databaseHardResetPayloadSchema.parse(payload)
  if (parsedPayload.confirmation !== hardResetConfirmation) {
    throw new ApplicationError(
      `Enter "${hardResetConfirmation}" to continue.`,
      { expectedConfirmation: hardResetConfirmation },
      400,
    )
  }

  await dropManagedTables()
  await runMigrations()
  await initializeApplicationSetup(true)

  return databaseManagerActionResponseSchema.parse({
    message: 'Managed codexsun tables were dropped and rebuilt from the latest migrations.',
    report: await buildDatabaseReport(),
  })
}

export async function restoreDatabase(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const parsedPayload = databaseRestorePayloadSchema.parse(payload)
  const job = await startRestoreJob(parsedPayload.fileName, parsedPayload.mode)
  return databaseRestoreResponseSchema.parse({ job })
}

export async function readRestoreDatabaseJob(user: AuthUser, jobId: string) {
  assertSuperAdmin(user)
  return databaseRestoreResponseSchema.parse({
    job: buildRestoreJobStatus(jobId),
  })
}

function getNextAutomatedBackupDelay(now = new Date()) {
  const nextRunAt = new Date(now)
  nextRunAt.setHours(environment.runtime.backups.auto.hour, 0, 0, 0)

  if (nextRunAt.getTime() <= now.getTime()) {
    nextRunAt.setDate(nextRunAt.getDate() + 1)
  }

  return nextRunAt.getTime() - now.getTime()
}

function scheduleNextAutomatedBackup() {
  if (!environment.runtime.backups.auto.enabled) {
    return
  }

  if (automatedBackupTimer) {
    clearTimeout(automatedBackupTimer)
  }

  automatedBackupTimer = setTimeout(() => {
    void runScheduledBackup()
  }, getNextAutomatedBackupDelay())
}

async function runScheduledBackup() {
  if (automatedBackupRunning) {
    return
  }

  automatedBackupRunning = true

  try {
    const backup = await createDatabaseBackupFile(scheduledBackupPrefix)
    if (!backup) {
      throw new ApplicationError('Scheduled backup generation failed.', {}, 500)
    }

    const scheduledBackups = readAvailableBackupSummaries()
      .filter((entry) => entry.fileName.startsWith(`${scheduledBackupPrefix}-`))
      .sort((left, right) => right.fileName.localeCompare(left.fileName))

    for (const backupFile of scheduledBackups.slice(Math.max(environment.runtime.backups.retentionCount, 1))) {
      deleteBackupFile(backupFile.fileName)
    }

    await deliverBackupExternally(backup.fileName)
    console.log(`Scheduled codexsun backup created: ${backup.fileName}`)
  } catch (error) {
    console.error('Scheduled codexsun backup failed.', error)
  } finally {
    automatedBackupRunning = false
    scheduleNextAutomatedBackup()
  }
}

export function startAutomatedDatabaseBackupScheduler() {
  if (!environment.runtime.backups.auto.enabled) {
    return
  }

  scheduleNextAutomatedBackup()
  console.log(`Automated codexsun backup scheduled daily at ${String(environment.runtime.backups.auto.hour).padStart(2, '0')}:00.`)
}

export function getHardResetConfirmationText() {
  return hardResetConfirmation
}
