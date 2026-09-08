import { z } from 'zod'

const workflowSchema = z.enum(['deliver', 'develop', 'document', 'review', 'test'])

const attachmentSchema = z.strictObject({
  dataUrl: z.string().startsWith('data:'),
  id: z.string().min(1),
  mimeType: z.string().min(1),
  name: z.string().min(1),
})

const deliverySchema = z.strictObject({
  publicationReady: z.boolean(),
  stages: z.array(
    z.strictObject({
      evidence: z.string().min(1),
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
  ),
})

const executionSchema = z.strictObject({
  activities: z.array(
    z.strictObject({
      kind: z.enum(['command', 'file_change', 'mcp']),
      label: z.string().min(1),
      status: z.string().min(1),
    }),
  ),
  delivery: deliverySchema.optional(),
  isolation: z.literal('ephemeral-thread'),
  tools: z.array(z.string().min(1)),
  worktreePath: z.string().min(1),
  workflow: workflowSchema,
})

const messageSchema = z.strictObject({
  attachments: z.array(attachmentSchema),
  content: z.string(),
  execution: executionSchema.optional(),
  id: z.string().min(1),
  role: z.enum(['assistant', 'user']),
})

const summarySchema = z.strictObject({
  archivedAt: z.iso.datetime().optional(),
  createdAt: z.iso.datetime(),
  id: z.uuid(),
  pinned: z.boolean(),
  projectId: z.uuid(),
  title: z.string().min(1),
  updatedAt: z.iso.datetime(),
})

export const chatTurnResponseSchema = z.strictObject({
  execution: executionSchema,
  message: z.strictObject({ content: z.string().min(1), role: z.literal('assistant') }),
  model: z.string().min(1),
  responseId: z.string().min(1),
})

export const conversationListResponseSchema = z.strictObject({
  conversations: z.array(summarySchema),
})

export const conversationResponseSchema = z.strictObject({
  conversation: summarySchema.extend({ messages: z.array(messageSchema) }),
})

export const deleteConversationResponseSchema = z.strictObject({ deletedId: z.uuid() })

export const deleteArchivedResponseSchema = z.strictObject({
  deletedCount: z.number().int().min(0),
})
