import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { CodexAppServerClient } from '../src/modules/codex-connection/codex-app-server.client.js'
import { resolveCodexCommand } from '../src/modules/codex-connection/codex-command.js'
import type { CodexWorktreeService } from '../src/modules/codex-connection/codex-worktree.service.js'

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
