import { z } from 'zod'

export const chatConversationHeaderName = 'x-zetro-conversation-id'
export const chatConversationIdSchema = z.uuid()

export const chatTurnStatusSchema = z.enum(['working', 'complete', 'stopped', 'failed'])

export const chatStreamEventSchema = z.discriminatedUnion('type', [
  z.object({ content: z.string(), type: z.literal('request') }),
  z.object({ delta: z.string(), type: z.literal('response') }),
  z.object({
    item: z.record(z.string(), z.unknown()),
    method: z.string(),
    type: z.literal('activity'),
  }),
  z.object({ type: z.literal('complete') }),
  z.object({ type: z.literal('stopped') }),
  z.object({ message: z.string(), type: z.literal('error') }),
])

export const chatPromptRequestSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .max(64 * 1024),
  turnId: z.uuid(),
})

export const chatStopRequestSchema = z.object({ turnId: z.uuid() })

export const chatTurnParamsSchema = z.object({ turnId: z.uuid() })

export const chatEventStreamQuerySchema = z.object({
  after: z.coerce.number().int().nonnegative().default(0),
})

export const chatTurnAcceptedResponseSchema = z.object({
  conversationId: chatConversationIdSchema,
  status: z.literal('working'),
  turnId: z.uuid(),
})

export const storedChatEventSchema = z.object({
  event: chatStreamEventSchema,
  sequence: z.number().int().positive(),
})

export const storedChatTurnSchema = z.object({
  completedAt: z.number().int().nonnegative().optional(),
  events: z.array(storedChatEventSchema),
  id: z.uuid(),
  prompt: z.string(),
  startedAt: z.number().int().nonnegative(),
  status: chatTurnStatusSchema,
})

export const chatHistoryResponseSchema = z.object({
  conversationId: chatConversationIdSchema,
  turns: z.array(storedChatTurnSchema),
})

export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>
export type ChatStoredEvent = z.infer<typeof storedChatEventSchema>
export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>
export type ChatTurnAcceptedResponse = z.infer<typeof chatTurnAcceptedResponseSchema>
export type ChatTurnStatus = z.infer<typeof chatTurnStatusSchema>
export type StoredChatTurn = z.infer<typeof storedChatTurnSchema>

export function encodeChatServerEvent(event: ChatStoredEvent) {
  return `id: ${event.sequence}\nevent: chat\ndata: ${JSON.stringify(event)}\n\n`
}

export function parseChatServerEvent(data: string): ChatStoredEvent {
  return storedChatEventSchema.parse(JSON.parse(data) as unknown)
}
