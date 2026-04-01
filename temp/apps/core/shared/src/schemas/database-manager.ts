import { z } from 'zod'
import { databaseVersionSummarySchema } from './version'

export const databaseManagerTableStatusSchema = z.enum(['ok', 'missing', 'unexpected'])
export const databaseManagerReportStatusSchema = z.enum(['ready', 'warning', 'error', 'disabled'])

export const databaseManagerTableSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  exists: z.boolean(),
  expected: z.boolean(),
  status: databaseManagerTableStatusSchema,
  rowCount: z.number().int().nonnegative().nullable(),
  columnCount: z.number().int().nonnegative().nullable(),
})

export const databaseBackupSummarySchema = z.object({
  fileName: z.string().min(1),
  createdAt: z.string().min(1),
  byteSize: z.number().int().nonnegative(),
  downloadPath: z.string().min(1),
})

export const databaseVerificationSummarySchema = z.object({
  status: databaseManagerReportStatusSchema,
  checkedAt: z.string().min(1),
  detail: z.string().min(1),
  expectedTableCount: z.number().int().nonnegative(),
  existingTableCount: z.number().int().nonnegative(),
  existingManagedTableCount: z.number().int().nonnegative(),
  missingTableCount: z.number().int().nonnegative(),
  unexpectedTableCount: z.number().int().nonnegative(),
  totalRowCount: z.number().int().nonnegative(),
})

export const databaseManagerReportSchema = z.object({
  database: databaseVersionSummarySchema,
  verification: databaseVerificationSummarySchema,
  tables: z.array(databaseManagerTableSchema),
  latestBackup: databaseBackupSummarySchema.nullable(),
  availableBackups: z.array(databaseBackupSummarySchema),
})

export const databaseManagerResponseSchema = z.object({
  report: databaseManagerReportSchema,
})

export const databaseManagerActionResponseSchema = z.object({
  message: z.string().min(1),
  report: databaseManagerReportSchema,
})

export const databaseBackupResponseSchema = z.object({
  message: z.string().min(1),
  backup: databaseBackupSummarySchema,
  report: databaseManagerReportSchema,
})

export const databaseHardResetPayloadSchema = z.object({
  confirmation: z.string().trim().min(1),
})

export const databaseBackupUploadPayloadSchema = z.object({
  fileName: z.string().trim().min(1),
  content: z.string().min(1),
})

export const databaseBackupUploadResponseSchema = z.object({
  message: z.string().min(1),
  backup: databaseBackupSummarySchema,
  report: databaseManagerReportSchema,
})

export const databaseBackupDeleteResponseSchema = z.object({
  message: z.string().min(1),
  deletedFileName: z.string().min(1),
  report: databaseManagerReportSchema,
})

export const databaseRestoreModeSchema = z.enum(['fresh', 'incremental'])

export const databaseRestorePayloadSchema = z.object({
  fileName: z.string().trim().min(1),
  mode: databaseRestoreModeSchema.default('fresh'),
})

export const databaseRestoreSummarySchema = z.object({
  mode: databaseRestoreModeSchema,
  tablesProcessed: z.number().int().nonnegative(),
  rowsInserted: z.number().int().nonnegative(),
  rowsSkipped: z.number().int().nonnegative(),
  chunksExecuted: z.number().int().nonnegative(),
})

export const databaseRestoreJobStatusSchema = z.enum(['queued', 'running', 'completed', 'failed'])

export const databaseRestoreJobResultSchema = z.object({
  message: z.string().min(1),
  restoredBackup: databaseBackupSummarySchema,
  safetyBackup: databaseBackupSummarySchema,
  summary: databaseRestoreSummarySchema,
  report: databaseManagerReportSchema,
})

export const databaseRestoreJobSchema = z.object({
  jobId: z.string().min(1),
  fileName: z.string().min(1),
  mode: databaseRestoreModeSchema,
  status: databaseRestoreJobStatusSchema,
  progress: z.number().int().min(0).max(100),
  step: z.string().min(1),
  startedAt: z.string().min(1),
  updatedAt: z.string().min(1),
  completedAt: z.string().min(1).nullable(),
  result: databaseRestoreJobResultSchema.nullable(),
  errorMessage: z.string().min(1).nullable(),
  errorContext: z.record(z.string(), z.unknown()).nullable(),
})

export const databaseRestoreResponseSchema = z.object({
  job: databaseRestoreJobSchema,
})

export type DatabaseManagerTableStatus = z.infer<typeof databaseManagerTableStatusSchema>
export type DatabaseManagerReportStatus = z.infer<typeof databaseManagerReportStatusSchema>
export type DatabaseManagerTable = z.infer<typeof databaseManagerTableSchema>
export type DatabaseBackupSummary = z.infer<typeof databaseBackupSummarySchema>
export type DatabaseVerificationSummary = z.infer<typeof databaseVerificationSummarySchema>
export type DatabaseManagerReport = z.infer<typeof databaseManagerReportSchema>
export type DatabaseManagerResponse = z.infer<typeof databaseManagerResponseSchema>
export type DatabaseManagerActionResponse = z.infer<typeof databaseManagerActionResponseSchema>
export type DatabaseBackupResponse = z.infer<typeof databaseBackupResponseSchema>
export type DatabaseHardResetPayload = z.infer<typeof databaseHardResetPayloadSchema>
export type DatabaseBackupUploadPayload = z.infer<typeof databaseBackupUploadPayloadSchema>
export type DatabaseBackupUploadResponse = z.infer<typeof databaseBackupUploadResponseSchema>
export type DatabaseBackupDeleteResponse = z.infer<typeof databaseBackupDeleteResponseSchema>
export type DatabaseRestoreMode = z.infer<typeof databaseRestoreModeSchema>
export type DatabaseRestorePayload = z.infer<typeof databaseRestorePayloadSchema>
export type DatabaseRestoreSummary = z.infer<typeof databaseRestoreSummarySchema>
export type DatabaseRestoreJobStatus = z.infer<typeof databaseRestoreJobStatusSchema>
export type DatabaseRestoreJobResult = z.infer<typeof databaseRestoreJobResultSchema>
export type DatabaseRestoreJob = z.infer<typeof databaseRestoreJobSchema>
export type DatabaseRestoreResponse = z.infer<typeof databaseRestoreResponseSchema>
