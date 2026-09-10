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
    resolveWorkingDirectory: async () => cwd,
  } as unknown as CodexWorktreeService
  const client = new CodexAppServerClient('unused', process.cwd(), worktrees)
  const transport = client as unknown as {
    request(method: string, params: Record<string, unknown>): Promise<unknown>
    handleNotification(method: string, params: unknown): void
  }
  transport.request = async (method, params) => {
    assert.equal(params.cwd, cwd)
    if (method === 'thread/start') return { thread: { id: 'thread' }, model: 'test' }
    assert.equal(method, 'turn/start')
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
    conversationId: randomUUID(),
    projectId: randomUUID(),
    projectRoot: process.cwd(),
    files: [],
    images: [],
    scope: { application: 'zetro', module: 'test', folderPath: 'apps/zetro' },
    text: 'Read only.',
    reasoningEffort: 'low',
    workflow: 'review',
  })
  assert.equal(result.activities.length, 20)
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
