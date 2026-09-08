import { z } from 'zod'

export const chatTurnResponseSchema = z.strictObject({
  execution: z.strictObject({
    activities: z.array(
      z.strictObject({
        kind: z.enum(['command', 'file_change', 'mcp']),
        label: z.string().min(1),
        status: z.string().min(1),
      }),
    ),
    delivery: z
      .strictObject({
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
      .optional(),
    isolation: z.literal('ephemeral-thread'),
    tools: z.array(z.string().min(1)),
    worktreePath: z.string().min(1),
    workflow: z.enum(['deliver', 'develop', 'document', 'review', 'test']),
  }),
  message: z.strictObject({
    content: z.string().min(1),
    role: z.literal('assistant'),
  }),
  model: z.string().min(1),
  responseId: z.string().min(1),
})

const attachmentSchema = z.strictObject({
  dataUrl: z.string().startsWith('data:'),
  id: z.string().min(1),
  mimeType: z.string().min(1),
  name: z.string().min(1),
})

const storedMessageSchema = z.strictObject({
  attachments: z.array(attachmentSchema),
  content: z.string(),
  execution: chatTurnResponseSchema.shape.execution.optional(),
  id: z.string().min(1),
  role: z.enum(['assistant', 'user']),
})

export const conversationSummarySchema = z.strictObject({
  createdAt: z.iso.datetime(),
  id: z.uuid(),
  pinned: z.boolean(),
  title: z.string().min(1),
  updatedAt: z.iso.datetime(),
})

export const conversationSchema = conversationSummarySchema.extend({
  messages: z.array(storedMessageSchema),
})

export const conversationListResponseSchema = z.strictObject({
  conversations: z.array(conversationSummarySchema),
})

export const conversationResponseSchema = z.strictObject({ conversation: conversationSchema })
