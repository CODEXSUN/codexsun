import {
  chatTurnResponseSchema,
  conversationListResponseSchema,
  conversationResponseSchema,
} from './chat.schema'
import type {
  ChatConversation,
  ChatConversationSummary,
  ChatMessage,
  ChatTurnResponse,
  ChatWorkflow,
} from './chat.types'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function requestChatTurn(
  conversationId: string,
  messages: readonly ChatMessage[],
  workflow: ChatWorkflow,
): Promise<ChatTurnResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/responses`, {
    body: JSON.stringify({
      conversationId,
      messages: messages.map(({ attachments, content, role }) => ({ attachments, content, role })),
      previousDelivery: findLatestDelivery(messages),
      workflow,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return readResponse(response, chatTurnResponseSchema)
}

function findLatestDelivery(messages: readonly ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const delivery = messages[index]?.execution?.delivery
    if (delivery) return delivery
  }
  return undefined
}

export async function listConversations(): Promise<ChatConversationSummary[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations`)
  return readResponse(response, conversationListResponseSchema).then(
    ({ conversations }) => conversations,
  )
}

export async function getConversation(conversationId: string): Promise<ChatConversation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations/${conversationId}`)
  return readResponse(response, conversationResponseSchema).then(({ conversation }) => conversation)
}

export async function createConversation(
  messages: readonly ChatMessage[],
): Promise<ChatConversation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations`, {
    body: JSON.stringify({ messages }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return readResponse(response, conversationResponseSchema).then(({ conversation }) => conversation)
}

export async function updateConversation(
  conversationId: string,
  update: { messages?: readonly ChatMessage[]; pinned?: boolean; title?: string },
): Promise<ChatConversation> {
  const response = await fetch(`${apiBaseUrl}/api/v1/chat/conversations/${conversationId}`, {
    body: JSON.stringify(update),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  })
  return readResponse(response, conversationResponseSchema).then(({ conversation }) => conversation)
}

async function readResponse<T>(
  response: Response,
  schema: { parse(value: unknown): T },
): Promise<T> {
  const payload = (await response.json()) as unknown
  if (!response.ok) throw new Error(readError(payload))
  return schema.parse(payload)
}

function readError(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const error = payload.error
    if (typeof error === 'string') return error
  }
  return 'Zetro could not complete this request.'
}
