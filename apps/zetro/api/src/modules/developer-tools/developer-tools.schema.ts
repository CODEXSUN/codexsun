import { z } from 'zod'

const editorSchema = z.enum(['auto', 'cursor', 'vscode', 'windsurf'])
const refreshSchema = z.union([z.literal(5), z.literal(15), z.literal(30), z.literal(60)])

export const toolSettingsSchema = z.strictObject({
  allowForceWithLease: z.boolean(),
  allowPullRequests: z.boolean(),
  allowPush: z.boolean(),
  autoRefreshSeconds: refreshSchema,
  branchPrefix: z
    .string()
    .trim()
    .max(48)
    .regex(/^[a-zA-Z0-9._/-]*$/, 'Use a valid branch prefix.'),
  commitInstructions: z.string().trim().max(2_000),
  compareBranch: z.string().trim().max(255),
  desktopNotifications: z.boolean(),
  editor: editorSchema,
  protectedBranches: z.array(z.string().trim().min(1).max(255)).max(20),
  trustedRepository: z.boolean(),
})

export const projectToolSettingsSchema = toolSettingsSchema.extend({ inheritGlobal: z.boolean() })

export const projectParametersSchema = z.strictObject({ projectId: z.string().uuid() })

export const compareQuerySchema = z.strictObject({
  base: z.string().trim().min(1).max(255),
})

export const gitActionSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('fetch') }),
  z.strictObject({ action: z.literal('sync'), strategy: z.enum(['merge', 'rebase']) }),
  z.strictObject({
    action: z.literal('branch'),
    name: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-zA-Z0-9._/-]+$/, 'Use a valid branch name.'),
  }),
  z.strictObject({
    action: z.literal('commit'),
    message: z.string().trim().min(1).max(500),
    stageAll: z.boolean(),
  }),
  z.strictObject({ action: z.literal('push'), forceWithLease: z.boolean() }),
  z.strictObject({ action: z.literal('revert'), commit: z.string().regex(/^[0-9a-f]{7,40}$/i) }),
])

export const launchActionSchema = z.strictObject({
  target: z.enum(['editor', 'files', 'terminal']),
})

export const repositoryScriptSchema = z.strictObject({
  script: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9:_-]+$/),
})

export const repositoryPathSchema = z.strictObject({
  path: z.string().trim().min(1).max(2_000),
})

export const diffQuerySchema = repositoryPathSchema.extend({
  staged: z.preprocess((value) => value === true || value === 'true', z.boolean()),
})

export const stageSchema = repositoryPathSchema.extend({
  hunk: z.number().int().min(0).optional(),
  staged: z.boolean(),
})

export const conflictResolutionSchema = repositoryPathSchema.extend({
  content: z.string().max(4_000_000).optional(),
  resolution: z.enum(['ours', 'theirs', 'manual']),
})

export const branchDeleteSchema = z.strictObject({
  branch: z.string().trim().min(1).max(255),
})

export const stashActionSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('create'), message: z.string().trim().max(500) }),
  z.strictObject({ action: z.enum(['apply', 'drop']), index: z.number().int().min(0) }),
])

export const pullRequestSchema = z.strictObject({
  base: z.string().trim().min(1).max(255),
  body: z.string().max(20_000),
  draft: z.boolean(),
  title: z.string().trim().min(1).max(500),
})
