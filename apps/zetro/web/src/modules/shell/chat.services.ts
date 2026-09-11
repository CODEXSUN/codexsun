import {
  chatHistoryResponseSchema,
  chatSessionHeaderName,
  chatTurnAcceptedResponseSchema,
  parseChatServerEvent,
  type ChatHistoryResponse,
  type ChatStoredEvent,
  type ChatTurnAcceptedResponse,
} from '@codexsun/zetro-contracts'

const baseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? 'http://127.0.0.1:6050').replace(/\/$/, '')
const sessionStorageKey = 'zetro.chat.session.v1'

export function getChatSessionId() {
  const existing = sessionStorage.getItem(sessionStorageKey)
  if (existing && /^[a-zA-Z0-9-]{1,128}$/.test(existing)) return existing
  const sessionId = crypto.randomUUID()
  sessionStorage.setItem(sessionStorageKey, sessionId)
  return sessionId
}

export async function fetchChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/history`, {
    headers: chatHeaders(sessionId),
  })
  return chatHistoryResponseSchema.parse(await readJson(response, 'Could not load chat history'))
}

export async function startChatTurn(
  sessionId: string,
  turnId: string,
  prompt: string,
): Promise<ChatTurnAcceptedResponse> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/turns`, {
    body: JSON.stringify({ prompt, turnId }),
    headers: chatHeaders(sessionId, true),
    method: 'POST',
  })
  return chatTurnAcceptedResponseSchema.parse(
    await readJson(response, 'Codex did not accept the prompt.'),
  )
}

export async function watchChatTurn(
  sessionId: string,
  turnId: string,
  afterSequence: number,
  onEvent: (event: ChatStoredEvent) => void,
  signal?: AbortSignal,
) {
  let cursor = afterSequence
  while (!signal?.aborted) {
    try {
      const response = await fetch(
        `${baseUrl}/api/zetro/v1/chat/turns/${encodeURIComponent(turnId)}/events?after=${cursor}`,
        { headers: chatHeaders(sessionId), signal },
      )
      if (!response.ok)
        throw new Error(await readError(response, 'Could not watch the Codex turn.'))
      if (!response.body) throw new Error('Codex returned an empty event stream.')
      const terminal = await readServerEvents(response.body, (stored) => {
        if (stored.sequence <= cursor) return
        cursor = stored.sequence
        onEvent(stored)
      })
      if (terminal) return
    } catch {
      if (signal?.aborted) return
      await waitForReconnect(signal)
      continue
    }
    await waitForReconnect(signal)
  }
}

export async function stopChatResponse(sessionId: string) {
  const response = await fetch(`${baseUrl}/api/zetro/v1/chat/stop`, {
    body: '{}',
    headers: chatHeaders(sessionId, true),
    method: 'POST',
  })
  if (!response.ok) throw new Error(await readError(response, 'Codex could not be stopped.'))
}

function chatHeaders(sessionId: string, json = false) {
  return {
    ...(json ? { 'content-type': 'application/json' } : {}),
    [chatSessionHeaderName]: sessionId,
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
      if (!data || message.includes('event: error')) continue
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

function waitForReconnect(signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve()
    const timer = window.setTimeout(resolve, 500)
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
