import { existsSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { z } from 'zod'
import {
  providerSelectionConfirmationSchema,
  providerSelectionRequestSchema,
  providerSettingsResponseSchema,
  type ChatStreamEvent,
  type ProviderSelectionRequest,
} from '@codexsun/zetro-contracts'
import type { CxzCodexRuntime } from './codex-runtime.js'

type CodexControl = Pick<
  CxzCodexRuntime,
  'account' | 'close' | 'deviceLogin' | 'models' | 'run' | 'smoke' | 'stop'
>

const completionSchema = z.object({
  conversationId: z.uuid(),
  messages: z
    .array(z.object({ content: z.string().min(1), role: z.enum(['assistant', 'user']) }))
    .min(1),
  model: z.string().min(1).optional(),
  prompt: z.string().min(1),
  providerThreadId: z.string().optional(),
  reasoningEffort: z.enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra']),
})
const stopSchema = z.object({ conversationId: z.uuid() })

export function createApp(codex: CodexControl, zetroApiUrl = 'http://127.0.0.1:6050') {
  const server = Fastify({ bodyLimit: 256 * 1024 })
  const publicRoot = resolve(import.meta.dirname, 'public')
  if (existsSync(publicRoot)) void server.register(fastifyStatic, { root: publicRoot })
  server.get('/health', () => ({ service: 'cxz', status: 'ok' }))
  server.get('/health/ready', () => ({ service: 'cxz', status: 'ready' }))
  server.get('/codex/health/ready', async (_request, reply) => {
    try {
      const account = await codex.account()
      return account.authenticated
        ? { service: 'cxz-codex', status: 'ready' }
        : reply.code(503).send({ message: 'CXZ Codex requires device login.' })
    } catch {
      return reply.code(503).send({ message: 'CXZ Codex is unavailable.' })
    }
  })
  server.get('/codex/account', () => codex.account())
  server.get('/codex/models', async () => ({ models: await codex.models() }))
  server.post('/codex/device-login', () => codex.deviceLogin())
  server.post('/codex/selection/confirm', async (request, reply) => {
    const selection = providerSelectionRequestSchema.safeParse(request.body)
    if (!selection.success || selection.data.connectionId !== 'cxz-codex') {
      return reply.code(400).send({ error: 'A valid CXZ Codex selection is required.' })
    }
    try {
      return await confirmSelection(codex, selection.data)
    } catch (error) {
      return reply.code(409).send({ error: message(error) })
    }
  })
  server.get('/zetro/providers', async (_request, reply) => {
    const result = await proxyZetro(`${zetroApiUrl}/api/zetro/v1/providers`, undefined, reply)
    if (!result || 'error' in result) return result
    try {
      const settings = providerSettingsResponseSchema.parse(result)
      const selected = settings.connections.find(
        ({ id }) => id === settings.selectedConnectionId && id === 'cxz-codex',
      )
      if (!selected?.model) return settings
      return settings
    } catch (error) {
      return reply.code(409).send({ error: message(error) })
    }
  })
  server.patch('/zetro/providers/default', async (request, reply) => {
    const selection = providerSelectionRequestSchema.safeParse(request.body)
    if (!selection.success || selection.data.connectionId !== 'cxz-codex') {
      return reply.code(400).send({ error: 'A valid CXZ Codex selection is required.' })
    }
    const result = await proxyZetro(
      `${zetroApiUrl}/api/zetro/v1/providers/default`,
      selection.data,
      reply,
    )
    if (!result || 'error' in result) return result
    try {
      const settings = providerSettingsResponseSchema.parse(result)
      const confirmation = settings.confirmation ?? (await confirmSelection(codex, selection.data))
      return { ...settings, confirmation }
    } catch (error) {
      return reply.code(409).send({ error: message(error) })
    }
  })
  server.post('/codex/v1/chat/completions', async (request, reply) => {
    const parsed = completionSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.code(400).send({ error: 'A valid CXZ chat request is required.' })
    reply.hijack()
    startStream(reply.raw)
    try {
      const result = await codex.run({
        conversationId: parsed.data.conversationId,
        effort: parsed.data.reasoningEffort,
        model: parsed.data.model,
        onEvent: (event) => write(reply.raw, event),
        onThread: (threadId) => write(reply.raw, { threadId, type: 'provider-thread' }),
        prompt: parsed.data.prompt,
        threadId: parsed.data.providerThreadId,
      })
      write(reply.raw, { content: result.content, status: result.status, type: 'complete' })
    } catch (error) {
      write(reply.raw, { error: message(error), type: 'error' })
    } finally {
      reply.raw.end()
    }
  })
  server.post('/codex/v1/chat/stop', async (request, reply) => stop(request.body, reply, codex))

  server.addHook('onClose', () => codex.close())
  return server
}

async function confirmSelection(codex: CodexControl, selection: ProviderSelectionRequest) {
  const account = await codex.account()
  if (!account.authenticated) throw new Error('CXZ Codex requires device authentication.')
  const models = await codex.models()
  const model = models.find(({ id }) => id === selection.model)
  if (!model) throw new Error('The selected CXZ model is unavailable.')
  if (
    model.supportedReasoningEfforts.length > 0 &&
    !model.supportedReasoningEfforts.includes(selection.reasoningEffort)
  ) {
    throw new Error('The selected reasoning level is unavailable.')
  }
  const smoke = await codex.smoke(model.id, selection.reasoningEffort)
  return providerSelectionConfirmationSchema.parse({
    accountLabel: account.label,
    confirmedAt: Date.now(),
    connected: true,
    connectionId: 'cxz-codex',
    model: model.id,
    providerLabel: 'CXZ Codex',
    reasoningEffort: selection.reasoningEffort,
    runtime: 'cxz',
    smoke,
  })
}

async function proxyZetro(
  url: string,
  body: ProviderSelectionRequest | undefined,
  reply: { code(status: number): { send(body: object): unknown } },
) {
  try {
    const response = await fetch(url, {
      body: body ? JSON.stringify(body) : undefined,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      method: body ? 'PATCH' : 'GET',
      signal: AbortSignal.timeout(5_000),
    })
    const result = (await response.json().catch(() => undefined)) as Record<string, unknown>
    if (!response.ok) {
      return reply.code(response.status).send({ error: messageFromBody(result) }) as {
        error: string
      }
    }
    return result
  } catch (error) {
    return reply.code(503).send({ error: message(error) }) as { error: string }
  }
}

function startStream(response: ServerResponse) {
  response.statusCode = 200
  response.setHeader('content-type', 'application/x-ndjson; charset=utf-8')
  response.setHeader('cache-control', 'no-cache, no-transform')
  response.flushHeaders()
}

function write(response: ServerResponse, value: ChatStreamEvent | Record<string, unknown>) {
  if (!response.destroyed) response.write(`${JSON.stringify(value)}\n`)
}

async function stop(
  body: unknown,
  reply: { code(status: number): { send(body: object): unknown } },
  runtime: { stop(conversationId: string): void | Promise<void> },
) {
  const parsed = stopSchema.safeParse(body)
  if (!parsed.success) return reply.code(400).send({ error: 'A conversation ID is required.' })
  try {
    await runtime.stop(parsed.data.conversationId)
    return { stopped: true }
  } catch (error) {
    return reply.code(409).send({ error: message(error) })
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : 'CXZ request failed.'
}

function messageFromBody(body: unknown) {
  if (!body || typeof body !== 'object') return 'The Zetro provider request failed.'
  const value = Reflect.get(body, 'error') ?? Reflect.get(body, 'message')
  return typeof value === 'string' ? value : 'The Zetro provider request failed.'
}
