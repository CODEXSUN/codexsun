import { z } from 'zod'

const syncStrategySchema = z.enum(['merge', 'none', 'rebase'])
const databaseUpdateSchema = z.enum(['auto', 'no', 'yes'])

export const gitDeliverySettingsSchema = z.strictObject({
  defaultChangelog: z.boolean(),
  defaultDatabaseUpdate: databaseUpdateSchema,
  defaultPush: z.boolean(),
  defaultSyncStrategy: syncStrategySchema,
  defaultVersionBump: z.boolean(),
  enabled: z.boolean(),
})

export const projectGitDeliverySettingsSchema = gitDeliverySettingsSchema.extend({
  inheritGlobal: z.boolean(),
})

export const gitDeliveryFlowSchema = z.strictObject({
  bumpVersion: z.boolean(),
  commitMessage: z.string().trim().min(1).max(500),
  databaseUpdate: databaseUpdateSchema,
  expectedFiles: z.array(z.string().min(1).max(500)).max(2_000),
  expectedHead: z.string().regex(/^[0-9a-f]{40}$/iu),
  note: z.string().trim().min(1).max(2_000),
  push: z.boolean(),
  syncStrategy: syncStrategySchema,
  title: z.string().trim().min(1).max(160),
  writeChangelog: z.boolean(),
})

export const projectParametersSchema = z.strictObject({ projectId: z.string().uuid() })
