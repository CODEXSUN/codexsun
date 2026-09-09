import {
  chatTurnResponseSchema,
  conversationListResponseSchema,
  conversationResponseSchema,
  deleteArchivedResponseSchema,
  deleteConversationResponseSchema,
  stopChatResponseSchema,
} from './agent-chat.schema'
import type {
  ChatConversation,
  ChatConversationSummary,
  ChatMessage,
  ChatTurnResponse,
  ChatWorkspaceScope,
  ChatWorkflow,
} from './agent-chat.types'
import { zetroFetch } from '../../lib/zetro-api'
import type { ZetroCodexModel, ZetroReasoningEffort } from '../settings'

const apiBaseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')

export async function listConversations(projectId: string): Promise<ChatConversationSummary[]> {
  const response = await zetroFetch(
    `${apiBaseUrl}/api/v1/chat/conversations?${projectQuery(projectId)}`,
  )
  return readResponse(response, conversationListResponseSchema).then(
    ({ conversations }) => conversations,
  )
}

export async function listArchivedConversations(
  projectId: string,
): Promise<ChatConversationSummary[]> {
  const response = await zetroFetch(
    `${apiBaseUrl}/api/v1/chat/conversations?${projectQuery(projectId, true)}`,
  )
  return readResponse(response, conversationListResponseSchema).then(
    ({ conversations }) => conversations,
  )
}

export async function getConversation(
  projectId: string,
  conversationId: string,
): Promise<ChatConversation> {
  const response = await zetroFetch(
    `${apiBaseUrl}/api/v1/chat/conversations/${conversationId}?${projectQuery(projectId)}`,
  )
  return readResponse(response, conversationResponseSchema).then(({ conversation }) => conversation)
}

export async function createConversation(
  projectId: string,
  messages: readonly ChatMessage[],
  scope?: ChatWorkspaceScope,
) {
  const response = await zetroFetch(`${apiBaseUrl}/api/v1/chat/conversations`, {
    body: JSON.stringify({ messages, projectId, scope }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  return readResponse(response, conversationResponseSchema).then(({ conversation }) => conversation)
}

export async function updateConversation(
  projectId: string,
  conversationId: string,
  update: {
    archived?: boolean
    messages?: readonly ChatMessage[]
    pinned?: boolean
    scope?: ChatWorkspaceScope
    title?: string
  },
) {
  const response = await zetroFetch(
    `${apiBaseUrl}/api/v1/chat/conversations/${conversationId}?${projectQuery(projectId)}`,
    {
      body: JSON.stringify(update),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    },
  )
  return readResponse(response, conversationResponseSchema).then(({ conversation }) => conversation)
}

export async function deleteConversation(projectId: string, conversationId: string): Promise<void> {
  const response = await zetroFetch(
    `${apiBaseUrl}/api/v1/chat/conversations/${conversationId}?${projectQuery(projectId)}`,
    { method: 'DELETE' },
  )
  await readResponse(response, deleteConversationResponseSchema)
}

export async function deleteArchivedConversations(projectId: string): Promise<number> {
  const response = await zetroFetch(
    `${apiBaseUrl}/api/v1/chat/conversations/archived?${projectQuery(projectId)}`,
    {
      method: 'DELETE',
    },
  )
  return readResponse(response, deleteArchivedResponseSchema).then(
    ({ deletedCount }) => deletedCount,
  )
}

export async function requestChatTurn(
  conversationId: string,
  projectId: string,
  messages: readonly ChatMessage[],
  workflow: ChatWorkflow,
  selection: {
    model?: Exclude<ZetroCodexModel, 'default'>
    reasoningEffort: ZetroReasoningEffort
  },
  signal?: AbortSignal,
): Promise<ChatTurnResponse> {
  const response = await zetroFetch(`${apiBaseUrl}/api/v1/chat/responses`, {
    body: JSON.stringify({
      conversationId,
      messages: messages.slice(-24).map(({ attachments, content, role }) => ({
        attachments,
        content,
        role,
      })),
      previousDelivery: findLatestDelivery(messages),
      projectId,
      ...selection,
      workflow,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    signal,
  })
  return readResponse(response, chatTurnResponseSchema)
}

export async function stopChatTurn(conversationId: string, projectId: string): Promise<boolean> {
  const response = await zetroFetch(
    `${apiBaseUrl}/api/v1/chat/responses/${conversationId}/stop?${projectQuery(projectId)}`,
    { method: 'POST' },
  )
  return readResponse(response, stopChatResponseSchema).then(({ stopped }) => stopped)
}

function projectQuery(projectId: string, archived = false) {
  return new URLSearchParams({ archived: String(archived), projectId }).toString()
}

function findLatestDelivery(messages: readonly ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const delivery = messages[index]?.execution?.delivery
    if (delivery) return delivery
  }
  return undefined
}

async function readResponse<T>(
  response: Response,
  schema: { parse(value: unknown): T },
): Promise<T> {
  const text = await response.text()
  let payload: unknown

  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(
      response.ok ? 'Zetro returned an invalid response.' : 'Zetro API is unavailable.',
    )
  }

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
