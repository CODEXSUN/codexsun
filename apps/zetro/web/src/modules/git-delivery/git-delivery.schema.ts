import { z } from 'zod'

export const gitDeliverySettingsSchema = z.object({
  defaultChangelog: z.boolean(),
  defaultDatabaseUpdate: z.enum(['auto', 'no', 'yes']),
  defaultPush: z.boolean(),
  defaultSyncStrategy: z.enum(['merge', 'none', 'rebase']),
  defaultVersionBump: z.boolean(),
  enabled: z.boolean(),
})
export const projectGitDeliverySettingsSchema = gitDeliverySettingsSchema.extend({
  inheritGlobal: z.boolean(),
})
export const globalSettingsResponseSchema = z.object({ settings: gitDeliverySettingsSchema })
export const projectSettingsResponseSchema = z.object({
  effective: gitDeliverySettingsSchema,
  project: projectGitDeliverySettingsSchema,
})
export const gitDeliveryPreviewSchema = z.object({
  branch: z.string(),
  canBumpVersion: z.boolean(),
  canWriteChangelog: z.boolean(),
  changedFiles: z.array(z.string()),
  currentVersion: z.string().nullable(),
  githubUrl: z.string().nullable(),
  head: z.string(),
  nextVersion: z.string().nullable(),
  remoteUrl: z.string().nullable(),
  suggestedCommitMessage: z.string(),
  upstream: z.string().nullable(),
})
const flowStepSchema = z.object({
  id: z.enum(['changelog', 'commit', 'push', 'sync', 'version']),
  message: z.string(),
  status: z.enum(['complete', 'failed', 'skipped']),
})
export const gitDeliveryFlowSchema = z.object({
  completedAt: z.string(),
  createdAt: z.string(),
  error: z.string().nullable(),
  id: z.string(),
  input: z.object({
    bumpVersion: z.boolean(),
    commitMessage: z.string(),
    databaseUpdate: z.enum(['auto', 'no', 'yes']),
    expectedFiles: z.array(z.string()),
    expectedHead: z.string(),
    note: z.string(),
    push: z.boolean(),
    syncStrategy: z.enum(['merge', 'none', 'rebase']),
    title: z.string(),
    writeChangelog: z.boolean(),
  }),
  projectId: z.string(),
  status: z.enum(['complete', 'failed', 'running']),
  steps: z.array(flowStepSchema),
})
export const gitDeliveryFlowListSchema = z.object({ flows: z.array(gitDeliveryFlowSchema) })
