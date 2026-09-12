import {
  chatConversationListResponseSchema,
  chatConversationSummarySchema,
  chatConversationUpdateRequestSchema,
  chatHandoffTraySchema,
  chatImageArtifactSchema,
  chatImageUploadResponseSchema,
  chatImageUploadRequestSchema,
  type ChatHandoffItem,
  type ChatDecisionItem,
  type ChatDecisionUpsertRequest,
  chatDecisionItemSchema,
  chatDecisionListResponseSchema,
  type ChatWorkingSetCategory,
  type ChatWorkingSetSourceKind,
  type ChatImageArtifact,
  chatConversationHeaderName,
  chatConversationIdSchema,
  chatHistoryResponseSchema,
  chatTurnAcceptedResponseSchema,
  parseChatServerEvent,
  type ChatHistoryResponse,
  type ChatConversationListScope,
  type ChatConversationSummary,
  type ChatConversationUpdateRequest,
  type ChatStoredEvent,
  type ChatTurnAcceptedResponse,
} from '@codexsun/zetro-contracts'

const baseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? 'http://127.0.0.1:6050').replace(/\/$/, '')
const conversationStorageKey = 'zetro.chat.conversation.v2'
const legacySessionStorageKey = 'zetro.chat.session.v1'

export function getChatConversationId() {
  const existing =
    localStorage.getItem(conversationStorageKey) ?? sessionStorage.getItem(legacySessionStorageKey)
  const parsed = chatConversationIdSchema.safeParse(existing)
  if (parsed.success) {
    localStorage.setItem(conversationStorageKey, parsed.data)
    sessionStorage.removeItem(legacySessionStorageKey)
    return parsed.data
  }
  const conversationId = crypto.randomUUID()
  localStorage.setItem(conversationStorageKey, conversationId)
  return conversationId
}

export function setChatConversationId(conversationId: string) {
  localStorage.setItem(conversationStorageKey, chatConversationIdSchema.parse(conversationId))
}

export async function fetchConversationRegistry(
  scope: ChatConversationListScope = 'all',
): Promise<ChatConversationSummary[]> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/conversations?scope=${scope}`)
  const result = chatConversationListResponseSchema.parse(
    await readJson(response, 'Could not load conversation history.'),
  )
  return result.conversations
}

export async function createChatConversation(title?: string): Promise<ChatConversationSummary> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/conversations`, {
    body: JSON.stringify(title ? { title } : {}),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  return chatConversationSummarySchema.parse(
    await readJson(response, 'Could not create the conversation.'),
  )
}

export async function updateChatConversation(
  conversationId: string,
  update: ChatConversationUpdateRequest,
): Promise<ChatConversationSummary> {
  const payload = chatConversationUpdateRequestSchema.parse(update)
  const response = await fetch(
    `${baseUrl}/api/zetro/v1/chat/conversations/${encodeURIComponent(conversationId)}`,
    {
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
      method: 'PATCH',
    },
  )
  return chatConversationSummarySchema.parse(
    await readJson(response, 'Could not update the conversation.'),
  )
}

export async function fetchChatHistory(conversationId: string): Promise<ChatHistoryResponse> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/history`, {
    headers: chatHeaders(conversationId),
  })
  return chatHistoryResponseSchema.parse(await readJson(response, 'Could not load chat history'))
}

export async function fetchHandoffTray(): Promise<ChatHandoffItem[]> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/handoff-tray`)
  return chatHandoffTraySchema.parse(await readJson(response, 'Could not load the Handoff Tray.')).items
}

export async function clearHandoffTray(): Promise<ChatHandoffItem[]> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/handoff-tray`, { method: 'DELETE' })
  return chatHandoffTraySchema.parse(await readJson(response, 'Could not clear the Working Set.')).items
}

export async function removeWorkingSetDecision(conversationId: string, decisionId: string): Promise<ChatHandoffItem[]> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/decisions/${encodeURIComponent(decisionId)}`, { headers: chatHeaders(conversationId), method: 'DELETE' })
  return chatHandoffTraySchema.parse(await readJson(response, 'Could not remove the decision.')).items
}

export async function setHandoffSelection(
  conversationId: string,
  turnId: string,
  selection: { category?: ChatWorkingSetCategory; selected: boolean; sourceKind?: ChatWorkingSetSourceKind },
): Promise<ChatHandoffItem[]> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/handoff-tray/${encodeURIComponent(turnId)}`, {
    body: JSON.stringify(selection),
    headers: chatHeaders(conversationId, true),
    method: 'PUT',
  })
  return chatHandoffTraySchema.parse(await readJson(response, 'Could not update the Handoff Tray.')).items
}

export async function fetchTurnDecisions(conversationId: string, turnId: string): Promise<ChatDecisionItem[]> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/turns/${encodeURIComponent(turnId)}/decisions`, { headers: chatHeaders(conversationId) })
  return chatDecisionListResponseSchema.parse(await readJson(response, 'Could not load open decisions.')).decisions
}

export async function saveTurnDecision(conversationId: string, turnId: string, decision: ChatDecisionUpsertRequest): Promise<ChatDecisionItem> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/turns/${encodeURIComponent(turnId)}/decisions`, {
    body: JSON.stringify(decision), headers: chatHeaders(conversationId, true), method: 'PUT',
  })
  return chatDecisionItemSchema.parse(await readJson(response, 'Could not save the decision.'))
}

export async function startChatTurn(
  conversationId: string,
  turnId: string,
  prompt: string,
  imageIds: string[] = [],
): Promise<ChatTurnAcceptedResponse> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/turns`, {
    body: JSON.stringify({ imageIds, prompt, turnId }),
    headers: chatHeaders(conversationId, true),
    method: 'POST',
  })
  return chatTurnAcceptedResponseSchema.parse(
    await readJson(response, 'Codex did not accept the prompt.'),
  )
}

export async function uploadChatImage(conversationId: string, file: File): Promise<ChatImageArtifact> {
  const dataUrl = await readAsDataUrl(file)
  const payload = chatImageUploadRequestSchema.parse({ dataUrl, name: file.name || 'Pasted image' })
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/images`, {
    body: JSON.stringify(payload),
    headers: chatHeaders(conversationId, true),
    method: 'POST',
  })
  return chatImageArtifactSchema.parse(
    chatImageUploadResponseSchema.parse(await readJson(response, 'Could not upload the image.')).image,
  )
}

export async function watchChatTurn(
  conversationId: string,
  turnId: string,
  afterSequence: number,
  onEvent: (event: ChatStoredEvent) => void,
  onConnectionState: (state: 'connected' | 'reconnecting') => void,
  signal?: AbortSignal,
) {
  let cursor = afterSequence
  let retryMilliseconds = 250
  while (!signal?.aborted) {
    try {
      const response = await fetch(
        `${baseUrl}/api/zetro/v1/chat/turns/${encodeURIComponent(turnId)}/events?after=${cursor}`,
        { headers: chatHeaders(conversationId), signal },
      )
      if (!response.ok) {
        throw new ChatHttpError(
          await readError(response, 'Could not watch the Codex turn.'),
          response.status,
        )
      }
      if (!response.body) throw new Error('Codex returned an empty event stream.')
      onConnectionState('connected')
      let receivedEvent = false
      const terminal = await readServerEvents(response.body, (stored) => {
        receivedEvent = true
        if (stored.sequence <= cursor) return
        cursor = stored.sequence
        onEvent(stored)
      })
      if (receivedEvent) retryMilliseconds = 250
      if (terminal) return
    } catch (error) {
      if (signal?.aborted) return
      if (error instanceof ChatHttpError && !error.retryable) throw error
    }
    onConnectionState('reconnecting')
    await waitForReconnect(retryMilliseconds, signal)
    retryMilliseconds = Math.min(retryMilliseconds * 2, 4_000)
  }
}

export async function stopChatResponse(conversationId: string, turnId: string) {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/stop`, {
    body: JSON.stringify({ turnId }),
    headers: chatHeaders(conversationId, true),
    method: 'POST',
  })
  if (!response.ok) throw new Error(await readError(response, 'Codex could not be stopped.'))
}

function chatHeaders(conversationId: string, json = false) {
  return {
    ...(json ? { 'content-type': 'application/json' } : {}),
    [chatConversationHeaderName]: conversationId,
  }
}

async function readJson(response: Response, fallback: string): Promise<unknown> {
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(errorFromBody(body) ?? fallback)
  return body
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => undefined)
  return errorFromBody(body) ?? fallback
}

function errorFromBody(body: unknown) {
  if (!body || typeof body !== 'object') return undefined
  const error = Reflect.get(body, 'error')
  return typeof error === 'string' ? error : undefined
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read the image.'))
    reader.readAsDataURL(file)
  })
}

async function readServerEvents(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ChatStoredEvent) => void,
) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let terminal = false
  while (true) {
    const result = await reader.read()
    buffer += decoder.decode(result.value, { stream: !result.done }).replace(/\r\n/g, '\n')
    const messages = buffer.split('\n\n')
    buffer = messages.pop() ?? ''
    for (const message of messages) {
      const data = message
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n')
      if (!data) continue
      if (message.includes('event: error')) {
        throw new Error(errorFromBody(JSON.parse(data) as unknown) ?? 'The event stream failed.')
      }
      const stored = parseChatServerEvent(data)
      onEvent(stored)
      terminal ||= isTerminal(stored)
    }
    if (result.done) return terminal
  }
}

function isTerminal(stored: ChatStoredEvent) {
  const { type } = stored.event
  return type === 'complete' || type === 'stopped' || type === 'error'
}

function waitForReconnect(delayMilliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve()
    const timer = window.setTimeout(resolve, delayMilliseconds)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

class ChatHttpError extends Error {
  readonly retryable: boolean

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ChatHttpError'
    this.retryable = status === 408 || status === 425 || status === 429 || status >= 500
  }
}
