import { z } from 'zod'

export const databaseVersionStatusSchema = z.enum(['ready', 'disabled', 'error'])

export const applicationVersionSummarySchema = z.object({
  name: z.literal('codexsun'),
  version: z.string().min(1),
  sourceMode: z.enum(['embedded', 'git']),
  currentCommitSha: z.string().min(7).nullable(),
})

export const databaseVersionSummarySchema = z.object({
  status: databaseVersionStatusSchema,
  currentVersionId: z.string().min(1).nullable(),
  currentVersionName: z.string().min(1).nullable(),
  latestVersionId: z.string().min(1),
  latestVersionName: z.string().min(1),
  appliedMigrations: z.number().int().nonnegative(),
  pendingMigrations: z.number().int().nonnegative(),
  checkedAt: z.string().min(1),
  detail: z.string().min(1),
})

export const systemVersionSchema = z.object({
  application: applicationVersionSummarySchema,
  database: databaseVersionSummarySchema,
})

export const systemVersionResponseSchema = z.object({
  version: systemVersionSchema,
})

export const systemUpdateCheckSchema = z.object({
  sourceMode: z.enum(['embedded', 'git']),
  repositoryUrl: z.string().min(1),
  branch: z.string().min(1),
  currentCommitSha: z.string().min(7).nullable(),
  remoteCommitSha: z.string().min(7).nullable(),
  updateAvailable: z.boolean(),
  canAutoCompare: z.boolean(),
  checkedAt: z.string().min(1),
  detail: z.string().min(1),
})

export const systemUpdateCheckResponseSchema = z.object({
  update: systemUpdateCheckSchema,
})

export type DatabaseVersionStatus = z.infer<typeof databaseVersionStatusSchema>
export type ApplicationVersionSummary = z.infer<typeof applicationVersionSummarySchema>
export type DatabaseVersionSummary = z.infer<typeof databaseVersionSummarySchema>
export type SystemVersion = z.infer<typeof systemVersionSchema>
export type SystemVersionResponse = z.infer<typeof systemVersionResponseSchema>
export type SystemUpdateCheck = z.infer<typeof systemUpdateCheckSchema>
export type SystemUpdateCheckResponse = z.infer<typeof systemUpdateCheckResponseSchema>
