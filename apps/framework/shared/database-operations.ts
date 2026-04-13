import { z } from "zod"

export const databaseBackupStatusSchema = z.enum([
  "completed",
  "failed",
  "pending",
  "restored",
])
export const databaseBackupDriverSchema = z.enum(["mariadb", "postgres"])
export const databaseBackupTriggerSchema = z.enum(["manual", "scheduled", "restore-point"])
export const backupStorageTargetSchema = z.enum(["local", "google_drive"])
export const googleDriveSyncStatusSchema = z.enum([
  "not_configured",
  "pending",
  "uploaded",
  "failed",
])

export const databaseBackupRecordSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1),
  filePath: z.string().min(1),
  driver: databaseBackupDriverSchema,
  status: databaseBackupStatusSchema,
  trigger: databaseBackupTriggerSchema,
  storageTarget: backupStorageTargetSchema,
  googleDriveSyncStatus: googleDriveSyncStatusSchema,
  googleDriveFileId: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative(),
  checksum: z.string().nullable(),
  summary: z.string().nullable(),
  createdAt: z.string().min(1),
  completedAt: z.string().nullable(),
})

export const databaseRestoreRunStatusSchema = z.enum([
  "completed",
  "failed",
  "scheduled_restart",
])
export const databaseRestoreRunModeSchema = z.enum(["drill", "live"])

export const databaseRestoreRunSchema = z.object({
  id: z.string().min(1),
  backupId: z.string().min(1),
  mode: databaseRestoreRunModeSchema,
  status: databaseRestoreRunStatusSchema,
  summary: z.string().nullable(),
  createdAt: z.string().min(1),
  completedAt: z.string().nullable(),
})

export const databaseBackupDashboardSchema = z.object({
  support: z.object({
    supported: z.boolean(),
    reason: z.string().nullable(),
  }),
  backupDirectory: z.string().min(1),
  scheduler: z.object({
    enabled: z.boolean(),
    cadenceHours: z.number().int().positive(),
    maxBackups: z.number().int().positive(),
    lastVerifiedAt: z.string().nullable(),
  }),
  drive: z.object({
    enabled: z.boolean(),
    folderId: z.string().nullable(),
    configured: z.boolean(),
  }),
  latestBackup: databaseBackupRecordSchema.nullable(),
  backups: z.array(databaseBackupRecordSchema),
  restoreRuns: z.array(databaseRestoreRunSchema),
})

export const securityReviewStatusSchema = z.enum([
  "not_started",
  "in_review",
  "passed",
  "failed",
  "not_applicable",
])

export const securityReviewItemSchema = z.object({
  id: z.string().min(1),
  section: z.string().min(1),
  controlKey: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  status: securityReviewStatusSchema,
  evidence: z.string().nullable(),
  notes: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  updatedAt: z.string().min(1),
})

export const securityReviewRunSchema = z.object({
  id: z.string().min(1),
  overallStatus: z.enum(["healthy", "attention"]),
  summary: z.string().min(1),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().min(1),
  createdAt: z.string().min(1),
})

export const securityReviewDashboardSchema = z.object({
  lastReviewedAt: z.string().nullable(),
  counts: z.object({
    total: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    inReview: z.number().int().nonnegative(),
    remaining: z.number().int().nonnegative(),
  }),
  items: z.array(securityReviewItemSchema),
  runs: z.array(securityReviewRunSchema),
})

export const securityReviewItemUpdatePayloadSchema = z.object({
  status: securityReviewStatusSchema,
  evidence: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  reviewedBy: z.string().nullable().optional(),
})

export const securityReviewCompletePayloadSchema = z.object({
  reviewedBy: z.string().nullable().optional(),
  summary: z.string().min(1),
})

export type DatabaseBackupRecord = z.infer<typeof databaseBackupRecordSchema>
export type DatabaseRestoreRun = z.infer<typeof databaseRestoreRunSchema>
export type DatabaseBackupDashboard = z.infer<typeof databaseBackupDashboardSchema>
export type SecurityReviewItem = z.infer<typeof securityReviewItemSchema>
export type SecurityReviewRun = z.infer<typeof securityReviewRunSchema>
export type SecurityReviewDashboard = z.infer<typeof securityReviewDashboardSchema>
