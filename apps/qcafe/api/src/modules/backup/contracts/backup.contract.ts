import { z } from "zod";

export const backupScopeSchema = z.object({
  businessId: z.string().uuid(),
  locationId: z.string().uuid(),
});

const windowsAbsolutePath = z
  .string()
  .trim()
  .min(3)
  .max(320)
  .refine(
    (value) => /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("\\\\") || value.startsWith("/"),
    "Use an absolute data-folder path, for example C:\\ProgramData\\Codexsun\\Qcafe.",
  );

export const selectDataFolderSchema = backupScopeSchema.extend({
  folderPath: windowsAbsolutePath,
});

export const createBackupScheduleSchema = backupScopeSchema.extend({
  frequency: z.enum(["daily", "weekly", "manual"]),
  name: z.string().trim().min(2).max(120),
  retainCount: z.number().int().min(1).max(365),
});

export const scheduleIdSchema = z.object({ scheduleId: z.string().uuid() });

export const setScheduleActiveSchema = z.object({ active: z.boolean() });

export const recordBackupSchema = backupScopeSchema.extend({
  checksum: z.string().trim().min(8).max(128),
  fileRef: z.string().trim().min(1).max(320),
  scheduleId: z.string().uuid().optional(),
  sizeBytes: z.number().int().min(1),
  status: z.enum(["completed", "failed"]).default("completed"),
});

export const backupIdSchema = z.object({ backupId: z.string().uuid() });

export const submitRestoreCheckSchema = z.object({
  detail: z.string().trim().min(3).max(500).optional(),
  status: z.enum(["passed", "failed"]),
});

export const backupWorkspaceSchema = z.object({
  backupSchedules: z.array(z.record(z.unknown())),
  backups: z.array(z.record(z.unknown())),
  dataFolders: z.array(z.record(z.unknown())),
  restoreChecks: z.array(z.record(z.unknown())),
});

export type BackupScope = z.infer<typeof backupScopeSchema>;
export type SelectDataFolder = z.infer<typeof selectDataFolderSchema>;
export type CreateBackupSchedule = z.infer<typeof createBackupScheduleSchema>;
export type RecordBackup = z.infer<typeof recordBackupSchema>;
