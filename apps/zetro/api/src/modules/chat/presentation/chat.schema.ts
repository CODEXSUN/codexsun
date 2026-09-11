import {
  chatConversationHeaderName,
  chatConversationCreateRequestSchema,
  chatConversationIdSchema,
  chatConversationListQuerySchema,
  chatConversationParamsSchema,
  chatConversationUpdateRequestSchema,
  chatEventStreamQuerySchema,
  chatPromptRequestSchema,
  chatStopRequestSchema,
  chatTurnParamsSchema,
} from '@codexsun/zetro-contracts'

export {
  chatConversationCreateRequestSchema,
  chatConversationListQuerySchema,
  chatConversationParamsSchema,
  chatConversationUpdateRequestSchema,
  chatEventStreamQuerySchema,
  chatPromptRequestSchema,
  chatStopRequestSchema,
  chatTurnParamsSchema,
}

export function readConversationId(headers: Record<string, string | string[] | undefined>) {
  const value = headers[chatConversationHeaderName]
  const parsed = chatConversationIdSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error('A valid Zetro conversation ID is required.')
  }
  return parsed.data
}
