import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  CodexAppServerClient,
  resolveCodexTurnConfiguration,
} from '../src/modules/codex-connection/codex-app-server.client.js'
import { resolveCodexCommand } from '../src/modules/codex-connection/codex-command.js'
import type { CodexWorktreeService } from '../src/modules/codex-connection/codex-worktree.service.js'

test('turns bind their cwd and retain late command failures in the bounded summary', async () => {
  const cwd = join(process.cwd(), 'apps', 'zetro')
  const worktrees = {
    ensure: async () => ({ path: process.cwd(), revision: 'test' }),
    writeInputs: async () => [],
    resolveWorkingDirectory: async (_root: string, path: string) => join(process.cwd(), path),
  } as unknown as CodexWorktreeService
  const client = new CodexAppServerClient('unused', process.cwd(), worktrees)
  client.sandbox.assertReady = () => undefined // Transport test. Enforcement has its own negative tests.
  const progress: unknown[] = []
  const transport = client as unknown as {
    request(method: string, params: Record<string, unknown>): Promise<unknown>
    handleNotification(method: string, params: unknown): void
  }
  transport.request = async (method, params) => {
    assert.equal(params.cwd, cwd)
    if (method === 'thread/start') return { thread: { id: 'thread' }, model: 'test' }
    assert.equal(method, 'turn/start')
    assert.deepEqual(params.sandboxPolicy, {
      type: 'workspaceWrite',
      writableRoots: [cwd, join(process.cwd(), 'assist/records/zetro')],
      networkAccess: false,
      excludeTmpdirEnvVar: true,
      excludeSlashTmp: true,
    })
    transport.handleNotification('item/started', {
      threadId: 'thread',
      item: { id: 'cmd-1', type: 'commandExecution', command: 'read', status: 'inProgress' },
    })
    transport.handleNotification('item/agentMessage/delta', {
      threadId: 'thread',
      itemId: 'message-1',
      delta: 'Public update',
    })
    transport.handleNotification('item/reasoning/summaryTextDelta', {
      threadId: 'thread',
      delta: 'private reasoning excluded',
    })
    for (let index = 0; index < 22; index++) {
      transport.handleNotification('item/completed', {
        threadId: 'thread',
        item: { type: 'commandExecution', command: 'read', status: 'completed' },
      })
    }
    transport.handleNotification('item/completed', {
      threadId: 'thread',
      item: {
        type: 'commandExecution',
        command: 'read',
        status: 'failed',
        aggregatedOutput: 'token=secret access denied',
      },
    })
    transport.handleNotification('item/completed', {
      threadId: 'thread',
      item: { type: 'agentMessage', text: 'An answer is not proof.' },
    })
    transport.handleNotification('turn/completed', {
      threadId: 'thread',
      turn: { status: 'completed' },
    })
    return { turn: { id: 'turn' } }
  }
  const result = await client.runTurn({
    onProgress: (event) => progress.push(event),
    conversationId: randomUUID(),
    projectId: randomUUID(),
    projectRoot: process.cwd(),
    files: [],
    images: [],
    scope: {
      application: 'zetro',
      module: 'test',
      folderPath: 'apps/zetro',
      documentationPaths: ['assist/records/zetro'],
    },
    text: 'Read only.',
    reasoningEffort: 'low',
    workflow: 'review',
  })
  assert.equal(result.activities.length, 20)
  assert.ok(JSON.stringify(progress).includes('Public update'))
  assert.ok(JSON.stringify(progress).includes('running'))
  assert.ok(!JSON.stringify(progress).includes('private reasoning'))
  assert.equal(result.activities[0]?.status, 'failed')
  assert.match(result.activities[0]?.details ?? '', /access denied/)
  assert.doesNotMatch(result.activities[0]?.details ?? '', /secret/)
  await client.close()
})

test('a turn selection overrides the configured model and maps its reasoning effort', () => {
  assert.deepEqual(
    resolveCodexTurnConfiguration({ model: 'gpt-6-astra', reasoningEffort: 'high' }, 'gpt-5.6-sol'),
    { effort: 'high', model: 'gpt-6-astra' },
  )
  assert.deepEqual(resolveCodexTurnConfiguration({ reasoningEffort: 'low' }, 'gpt-5.6-sol'), {
    effort: 'low',
    model: 'gpt-5.6-sol',
  })
})

test('a timed-out turn requests provider interruption before returning failure', async () => {
  const worktrees = {
    ensure: async () => ({ path: process.cwd(), revision: 'test' }),
    writeInputs: async () => [],
    resolveWorkingDirectory: async () => process.cwd(),
  } as unknown as CodexWorktreeService
  const client = new CodexAppServerClient(
    'unused',
    process.cwd(),
    worktrees,
    undefined,
    undefined,
    undefined,
    20,
  )
  let interrupted = false
  client.sandbox.assertReady = () => undefined
  const transport = client as unknown as {
    request(method: string, params: unknown): Promise<unknown>
  }
  transport.request = async (method, params) => {
    if (method === 'thread/start') return { thread: { id: 'thread' }, model: 'test' }
    if (method === 'turn/start') return { turn: { id: 'turn' } }
    assert.equal(method, 'turn/interrupt')
    assert.deepEqual(params, { threadId: 'thread', turnId: 'turn' })
    interrupted = true
    return {}
  }
  await assert.rejects(
    client.runTurn({
      conversationId: randomUUID(),
      projectId: randomUUID(),
      projectRoot: process.cwd(),
      files: [],
      images: [],
      scope: { application: 'test', module: 'test', folderPath: '' },
      text: 'Read only.',
      reasoningEffort: 'low',
      workflow: 'review',
    }),
    /timed out/,
  )
  assert.equal(interrupted, true)
  await client.close()
})

test('Windows command discovery selects the newest desktop Codex executable', async () => {
  const localAppData = await mkdtemp(join(tmpdir(), 'zetro-codex-command-'))

  try {
    const oldCommand = join(localAppData, 'OpenAI', 'Codex', 'bin', 'old', 'codex.exe')
    const newCommand = join(localAppData, 'OpenAI', 'Codex', 'bin', 'new', 'codex.exe')
    await mkdir(join(oldCommand, '..'), { recursive: true })
    await mkdir(join(newCommand, '..'), { recursive: true })
    await writeFile(oldCommand, '')
    await writeFile(newCommand, '')
    await utimes(oldCommand, new Date(1_000), new Date(1_000))
    await utimes(newCommand, new Date(2_000), new Date(2_000))

    assert.equal(await resolveCodexCommand('codex', 'win32', localAppData), newCommand)
  } finally {
    await rm(localAppData, { force: true, recursive: true })
  }
})

test('a missing Codex executable rejects without terminating the API process', async () => {
  const client = new CodexAppServerClient(
    `missing-codex-${randomUUID()}`,
    process.cwd(),
    {} as CodexWorktreeService,
  )

  await assert.rejects(client.readAccount(), /Codex executable .* could not start/)
  await assert.rejects(client.readAccount(), /Codex executable .* could not start/)
  await client.close()
})
