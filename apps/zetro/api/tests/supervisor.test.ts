import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import Fastify from 'fastify'
import { readEnvironment } from '../src/config.js'
import { registerDesktopSessionAuth } from '../src/infrastructure/desktop-session-auth.js'
import { ChatService } from '../src/modules/chat/chat.service.js'
import { ChatConversationRepository } from '../src/modules/chat/chat.conversation.repository.js'
import { ChatConversationService } from '../src/modules/chat/chat.conversation.service.js'
import type { ChatProvider, ChatTurnResponse } from '../src/modules/chat/chat.types.js'
import { createDefaultProject } from '../src/modules/projects/projects.service.js'
import { SystemTaskRepository } from '../src/modules/system-tasks/system-tasks.repository.js'
import { LocalSystemTaskQueue } from '../src/modules/system-tasks/system-tasks.queue.js'
import { SystemTaskService } from '../src/modules/system-tasks/system-tasks.service.js'
import { registerSupervisorRoutes } from '../src/modules/supervisor/supervisor.routes.js'
import { SupervisorService } from '../src/modules/supervisor/supervisor.service.js'
import { openTestDatabase } from './test-database.js'

const token = 'supervisor-test-token-'.repeat(3)
const headers = { authorization: `Bearer ${token}` }

test('supervisor authentication is disabled by default and isolated from desktop credentials', async () => {
  for (const enabled of [false, true]) {
    const server = Fastify()
    registerDesktopSessionAuth(
      server,
      readEnvironment({
        ZETRO_SUPERVISOR_TOKEN: enabled ? token : undefined,
        ZETRO_DESKTOP_SESSION_TOKEN: 'desktop-token-'.repeat(4),
      }),
    )
    server.get('/api/v1/supervisor/capabilities', async () => ({ ok: true }))
    server.get('/api/v1/private', async () => ({ ok: true }))
    assert.equal(
      (await server.inject({ url: '/api/v1/supervisor/capabilities' })).statusCode,
      enabled ? 401 : 503,
    )
    assert.equal(
      (await server.inject({ url: '/api/v1/supervisor/capabilities', headers })).statusCode,
      enabled ? 200 : 503,
    )
    assert.equal((await server.inject({ url: '/api/v1/private', headers })).statusCode, 401)
    if (enabled) {
      assert.equal(
        (
          await server.inject({
            url: '/api/v1/supervisor/capabilities',
            headers: { ...headers, origin: 'http://tauri.localhost' },
          })
        ).statusCode,
        403,
      )
      assert.equal(
        (
          await server.inject({
            url: '/api/v1/supervisor/capabilities',
            headers,
            remoteAddress: '192.0.2.10',
          })
        ).statusCode,
        403,
      )
    }
    await server.close()
  }
  assert.throws(() => readEnvironment({ HOST: '0.0.0.0', ZETRO_SUPERVISOR_TOKEN: token }))
})

test('supervisor validates, saves chat results, and refuses replay', async (context) => {
  const fixture = await setup(context, { respond: async () => result(), stop: async () => true })
  const payload = fixture.request
  for (const invalid of [
    { ...payload, approved: false },
    { ...payload, workflow: 'deliver' },
    { ...payload, command: 'shell' },
  ]) {
    assert.equal(
      (
        await fixture.server.inject({
          method: 'POST',
          url: '/api/v1/supervisor/jobs',
          headers,
          payload: invalid,
        })
      ).statusCode,
      400,
    )
  }
  const response = await fixture.server.inject({
    method: 'POST',
    url: '/api/v1/supervisor/jobs',
    headers,
    payload,
  })
  assert.equal(response.statusCode, 202)
  const id = response.json().task.id as string
  const completed = await waitFor(fixture.tasks, id, 'completed')
  const saved = completed.result as ChatTurnResponse & { conversationId: string }
  assert.equal(saved.message.content, 'Reviewed successfully.')
  assert.equal(fixture.conversations.get(saved.conversationId).messages.length, 2)
  assert.equal((await fixture.service.get(id)).steps.length, 2)
  await assert.rejects(fixture.tasks.retry(id), /cannot replay/)
})

test('supervisor stop interrupts the provider and preserves stopped status', async (context) => {
  let finish: ((value: ChatTurnResponse) => void) | undefined
  let interrupted = false
  const fixture = await setup(context, {
    respond: () =>
      new Promise((resolve) => {
        finish = resolve
      }),
    stop: async () => {
      interrupted = true
      finish?.(result())
      return true
    },
  })
  const response = await fixture.server.inject({
    method: 'POST',
    url: '/api/v1/supervisor/jobs',
    headers,
    payload: fixture.request,
  })
  const id = response.json().task.id as string
  for (let attempt = 0; !finish && attempt < 100; attempt++)
    await new Promise((resolve) => setTimeout(resolve, 10))
  assert.ok(finish)
  assert.equal(
    (
      await fixture.server.inject({
        method: 'POST',
        url: '/api/v1/supervisor/jobs',
        headers,
        payload: fixture.request,
      })
    ).statusCode,
    409,
  )
  await fixture.service.stop(id)
  await waitFor(fixture.tasks, id, 'stopped')
  assert.equal(interrupted, true)
})

test('a provider answer cannot hide failed tool execution', async (context) => {
  const response = result()
  response.execution.activities = [
    { kind: 'command', label: 'read file', status: 'failed', details: 'Access denied.' },
  ]
  const fixture = await setup(context, { respond: async () => response, stop: async () => true })
  const submitted = await fixture.server.inject({
    method: 'POST',
    url: '/api/v1/supervisor/jobs',
    headers,
    payload: fixture.request,
  })
  const task = await waitFor(fixture.tasks, submitted.json().task.id, 'failed')
  assert.match(task.error ?? '', /Access denied/)
  assert.equal(fixture.conversations.list(fixture.request.projectId).length, 1)
})

test('single-attempt jobs block after restart without invoking their handler', async (context) => {
  const fixture = await setup(context, { respond: async () => result(), stop: async () => true })
  const now = new Date().toISOString()
  await fixture.repository.insert({
    id: 'recovered',
    input: {},
    type: 'supervisor.agent-turn',
    title: 'Interrupted',
    attempts: 1,
    maxAttempts: 1,
    recoveryCount: 0,
    status: 'running',
    projectId: null,
    createdAt: now,
    updatedAt: now,
    startedAt: now,
    completedAt: null,
    error: null,
    result: null,
  })
  await fixture.tasks.initialize()
  await fixture.tasks.start()
  const task = await waitFor(fixture.tasks, 'recovered', 'blocked')
  assert.match(task.error ?? '', /cannot replay/)
})

async function setup(context: test.TestContext, provider: ChatProvider) {
  const directory = await mkdtemp(join(tmpdir(), 'zetro-supervisor-'))
  await mkdir(join(directory, 'module'))
  const database = await openTestDatabase(directory)
  const repository = new SystemTaskRepository(database)
  const tasks = new SystemTaskService(repository, new LocalSystemTaskQueue())
  await tasks.initialize()
  const chatRepository = new ChatConversationRepository(
    database,
    join(directory, 'legacy.json'),
    'test',
  )
  await chatRepository.initialize()
  const conversations = new ChatConversationService(chatRepository)
  const project = createDefaultProject(directory)
  const service = new SupervisorService(
    { get: () => project, list: () => [project], create: async () => project },
    new ChatService(provider),
    conversations,
    tasks,
  )
  const server = Fastify()
  registerDesktopSessionAuth(server, readEnvironment({ ZETRO_SUPERVISOR_TOKEN: token }))
  await registerSupervisorRoutes(server, service)
  await tasks.start()
  context.after(async () => {
    await server.close()
    await tasks.close()
    await database.close()
    await rm(directory, { recursive: true, force: true })
  })
  return {
    server,
    tasks,
    service,
    repository,
    conversations,
    request: {
      projectId: project.id,
      prompt: 'Review this module.',
      approved: true,
      scope: { application: 'test', module: 'module', folderPath: 'module' },
    },
  }
}

function result(): ChatTurnResponse {
  return {
    message: { role: 'assistant', content: 'Reviewed successfully.' },
    model: 'test',
    responseId: 'test',
    execution: {
      activities: [],
      isolation: 'ephemeral-thread',
      tools: [],
      worktreePath: 'test-worktree',
      workflow: 'review',
    },
  }
}

async function waitFor(tasks: SystemTaskService, id: string, status: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const task = await tasks.get(id)
    if (task.status === status) return task
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error(`Task did not reach ${status}.`)
}
