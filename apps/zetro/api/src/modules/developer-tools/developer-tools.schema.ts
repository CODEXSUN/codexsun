import { z } from 'zod'

const editorSchema = z.enum(['auto', 'cursor', 'vscode', 'windsurf'])
const refreshSchema = z.union([z.literal(5), z.literal(15), z.literal(30), z.literal(60)])

export const toolSettingsSchema = z.strictObject({
  allowForceWithLease: z.boolean(),
  allowPush: z.boolean(),
  autoRefreshSeconds: refreshSchema,
  branchPrefix: z
    .string()
    .trim()
    .max(48)
    .regex(/^[a-zA-Z0-9._/-]*$/, 'Use a valid branch prefix.'),
  commitInstructions: z.string().trim().max(2_000),
  compareBranch: z.string().trim().max(255),
  editor: editorSchema,
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
