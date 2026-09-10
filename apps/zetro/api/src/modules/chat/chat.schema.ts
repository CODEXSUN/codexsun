import { z } from 'zod'
import { codexModels, codexReasoningEfforts, codexWorkflows } from '../codex-connection/index.js'

const attachmentSchema = z.strictObject({
  dataUrl: z.string().startsWith('data:').max(6_000_000),
  id: z.string().min(1).max(80),
  mimeType: z.string().min(1).max(120),
  name: z.string().min(1).max(180),
})

const messageFields = {
  attachments: z.array(attachmentSchema).max(4).default([]),
  content: z.string().max(20_000),
  role: z.enum(['assistant', 'user']),
}

const messageSchema = z.strictObject(messageFields).refine(hasMessageContent, {
  message: 'A message needs text or an attachment.',
})

export const chatWorkspaceScopeSchema = z.strictObject({
  documentationPaths: z.array(z.string().trim().min(1).max(1_024)).max(8).optional(),
  application: z.string().trim().min(1).max(80),
  folderPath: z.string().trim().min(1).max(1_024),
  module: z.string().trim().max(120),
})

export const validateWorkspaceScopeSchema = z.strictObject({
  projectId: z.uuid(),
  scope: chatWorkspaceScopeSchema,
})

const deliveryRunSchema = z.strictObject({
  publicationReady: z.boolean(),
  stages: z
    .array(
      z.strictObject({
        evidence: z.string().min(1).max(1_000),
        id: z.enum([
          'plan',
          'observe',
          'review',
          'assign',
          'implement',
          'verify',
          'document',
          'version',
          'publish',
        ]),
        status: z.enum(['blocked', 'complete', 'ready', 'skipped']),
        updatedAt: z.iso.datetime(),
      }),
    )
    .length(9),
})

export const chatTurnRequestSchema = z.strictObject({
  conversationId: z.string().uuid(),
  messages: z.array(messageSchema).min(1).max(24),
  model: z.enum(codexModels).optional(),
  previousDelivery: deliveryRunSchema.optional(),
  projectId: z.string().uuid(),
  reasoningEffort: z.enum(codexReasoningEfforts).default('medium'),
  workflow: z.enum(codexWorkflows).default('develop'),
})

const executionSchema = z.strictObject({
  activities: z
    .array(
      z.strictObject({
        details: z.string().max(2_000).optional(),
        kind: z.enum(['command', 'file_change', 'mcp']),
        label: z.string().min(1).max(500),
        status: z.string().min(1).max(80),
      }),
    )
    .max(20),
  delivery: deliveryRunSchema.optional(),
  isolation: z.literal('ephemeral-thread'),
  tools: z.array(z.string().min(1).max(80)).max(12),
  worktreePath: z.string().min(1).max(1_024),
  workflow: z.enum(codexWorkflows).default('develop'),
})

const storedMessageSchema = z
  .strictObject({
    ...messageFields,
    createdAt: z.iso.datetime(),
    execution: executionSchema.optional(),
    id: z.string().min(1).max(80),
  })
  .refine(hasMessageContent, { message: 'A message needs text or an attachment.' })

export const conversationParametersSchema = z.strictObject({
  conversationId: z.string().uuid(),
})

export const conversationListQuerySchema = z.strictObject({
  archived: z
    .enum(['false', 'true'])
    .default('false')
    .transform((value) => value === 'true'),
  projectId: z.string().uuid(),
})

export const createConversationSchema = z.strictObject({
  messages: z.array(storedMessageSchema).min(1).max(100),
  projectId: z.string().uuid(),
  scope: chatWorkspaceScopeSchema.optional(),
})

export const updateConversationSchema = z
  .strictObject({
    archived: z.boolean().optional(),
    messages: z.array(storedMessageSchema).min(1).max(100).optional(),
    pinned: z.boolean().optional(),
    scope: chatWorkspaceScopeSchema.optional(),
    title: z.string().trim().min(1).max(60).optional(),
  })
  .refine((update) => Object.values(update).some((value) => value !== undefined), {
    message: 'A conversation update needs one field.',
  })

function hasMessageContent(message: { attachments: readonly unknown[]; content: string }): boolean {
  return message.content.trim().length > 0 || message.attachments.length > 0
}
