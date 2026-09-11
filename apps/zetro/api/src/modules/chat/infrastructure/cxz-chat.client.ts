import { providerModelListResponseSchema, type ProviderModel } from '@codexsun/zetro-contracts'
import type { ProviderRunRequest, ProviderRunResult } from '../../providers/index.js'

export class CxzChatClient {
  private readonly active = new Map<string, { baseUrl: string; controller: AbortController }>()

  async run(request: ProviderRunRequest): Promise<ProviderRunResult> {
    const baseUrl = request.connection.baseUrl
    if (!baseUrl) throw new Error('The CXZ URL is missing.')
    const controller = new AbortController()
    this.active.set(request.conversationId, { baseUrl, controller })
    request.onEvent({
      item: { provider: request.connection.label, status: 'requesting' },
      method: 'provider/request',
      type: 'activity',
    })
    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        body: JSON.stringify({
          conversationId: request.conversationId,
          messages: request.messages,
          model: request.connection.model,
          prompt: request.prompt,
          providerThreadId: request.providerThreadId,
          reasoningEffort: request.connection.reasoningEffort,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        signal: controller.signal,
      })
      if (response.headers.get('content-type')?.includes('application/x-ndjson')) {
        if (!response.ok) throw new Error('The provider runtime request failed.')
        return await readStream(response, request)
      }
      const body = (await response.json().catch(() => undefined)) as unknown
      if (!response.ok) throw new Error(readError(body) ?? 'The CXZ request failed.')
      const content = readContent(body)
      request.onEvent({ delta: content, type: 'response' })
      return { content, status: 'complete' }
    } catch (error) {
      if (controller.signal.aborted) return { content: '', status: 'stopped' }
      throw error
    } finally {
      this.active.delete(request.conversationId)
    }
  }

  async stop(conversationId: string): Promise<void> {
    const active = this.active.get(conversationId)
    if (!active) throw new Error('This provider has no active response.')
    await fetch(`${active.baseUrl}/v1/chat/stop`, {
      body: JSON.stringify({ conversationId }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(2_000),
    }).catch(() => undefined)
    active.controller.abort()
  }

  async listModels(baseUrl: string): Promise<ProviderModel[]> {
    const response = await fetch(`${baseUrl}/models`)
    const body = await response.json().catch(() => undefined)
    if (!response.ok) throw new Error(readError(body) ?? 'Could not load CXZ models.')
    return providerModelListResponseSchema.parse(body).models
  }
}

async function readStream(
  response: Response,
  request: ProviderRunRequest,
): Promise<ProviderRunResult> {
  if (!response.body) throw new Error('The provider runtime returned no stream.')
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  let result: ProviderRunResult | undefined
  while (true) {
    const chunk = await reader.read()
    buffer += chunk.value ?? ''
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) result = consumeLine(line, request, result)
    if (chunk.done) break
  }
  if (buffer.trim()) result = consumeLine(buffer, request, result)
  if (!result) throw new Error('The provider runtime ended without a result.')
  return result
}

function consumeLine(
  line: string,
  request: ProviderRunRequest,
  current: ProviderRunResult | undefined,
) {
  if (!line.trim()) return current
  const value = JSON.parse(line) as Record<string, unknown>
  if (value.type === 'error') throw new Error(readError(value) ?? 'The provider runtime failed.')
  if (value.type === 'provider-thread' && typeof value.threadId === 'string') {
    request.onProviderThread(value.threadId)
    return current
  }
  if (value.type === 'response' || value.type === 'activity') {
    request.onEvent(value as unknown as Parameters<ProviderRunRequest['onEvent']>[0])
    return current
  }
  if (value.type === 'complete' && typeof value.content === 'string') {
    return {
      content: value.content,
      status: value.status === 'stopped' ? 'stopped' : 'complete',
    } satisfies ProviderRunResult
  }
  return current
}

function readContent(body: unknown): string {
  if (!body || typeof body !== 'object')
    throw new Error('The provider returned an invalid response.')
  const content = Reflect.get(body, 'content')
  if (typeof content !== 'string' || !content.trim())
    throw new Error('The provider returned no text.')
  return content
}

function readError(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const value = Reflect.get(body, 'error') ?? Reflect.get(body, 'message')
  return typeof value === 'string' ? value : undefined
}
