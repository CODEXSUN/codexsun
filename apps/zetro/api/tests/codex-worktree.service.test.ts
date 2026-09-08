import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import { CodexWorktreeService } from '../src/modules/codex-connection/codex-worktree.service.js'

const execute = promisify(execFile)

test('creates and reuses one detached worktree per Zetro conversation', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'zetro-worktrees-'))
  const repositoryRoot = join(temporaryRoot, 'repository')
  const worktreeRoot = join(temporaryRoot, 'tasks')
  const firstId = '11111111-1111-4111-8111-111111111111'
  const secondId = '22222222-2222-4222-8222-222222222222'

  try {
    await git(temporaryRoot, ['init', repositoryRoot])
    await git(repositoryRoot, ['config', 'user.email', 'zetro@example.test'])
    await git(repositoryRoot, ['config', 'user.name', 'Zetro Test'])
    await writeFile(join(repositoryRoot, 'README.md'), '# Worktree fixture\n', 'utf8')
    await git(repositoryRoot, ['add', 'README.md'])
    await git(repositoryRoot, ['commit', '-m', 'Initial fixture'])

    const service = new CodexWorktreeService(repositoryRoot, worktreeRoot)
    const first = await service.ensure(firstId)
    const repeated = await service.ensure(firstId)
    const second = await service.ensure(secondId)

    assert.equal(first.path, join(worktreeRoot, firstId))
    assert.equal(repeated.path, first.path)
    assert.equal(repeated.revision, first.revision)
    assert.notEqual(second.path, first.path)
    assert.equal(await git(first.path, ['rev-parse', '--is-inside-work-tree']), 'true')
    assert.equal(await git(first.path, ['branch', '--show-current']), '')
  } finally {
    await git(repositoryRoot, ['worktree', 'remove', '--force', join(worktreeRoot, firstId)]).catch(
      () => undefined,
    )
    await git(repositoryRoot, [
      'worktree',
      'remove',
      '--force',
      join(worktreeRoot, secondId),
    ]).catch(() => undefined)
    await rm(temporaryRoot, { force: true, recursive: true })
  }
})

test('creates project worktrees from the selected repository', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'zetro-project-worktrees-'))
  const defaultRoot = join(temporaryRoot, 'default')
  const selectedRoot = join(temporaryRoot, 'selected')
  const worktreeRoot = join(temporaryRoot, 'tasks')
  const projectId = '33333333-3333-4333-8333-333333333333'
  const conversationId = '44444444-4444-4444-8444-444444444444'
  const selectedWorktree = join(worktreeRoot, projectId, conversationId)

  try {
    await initializeRepository(defaultRoot, 'default')
    await initializeRepository(selectedRoot, 'selected')
    const service = new CodexWorktreeService(defaultRoot, worktreeRoot)

    const worktree = await service.ensure(conversationId, selectedRoot, projectId)

    assert.equal(worktree.path, selectedWorktree)
    assert.equal((await readFile(join(worktree.path, 'README.md'), 'utf8')).trim(), '# selected')
  } finally {
    await git(selectedRoot, ['worktree', 'remove', '--force', selectedWorktree]).catch(
      () => undefined,
    )
    await rm(temporaryRoot, { force: true, recursive: true })
  }
})

async function initializeRepository(repositoryRoot: string, name: string): Promise<void> {
  await git(dirname(repositoryRoot), ['init', repositoryRoot])
  await git(repositoryRoot, ['config', 'user.email', 'zetro@example.test'])
  await git(repositoryRoot, ['config', 'user.name', 'Zetro Test'])
  await writeFile(join(repositoryRoot, 'README.md'), `# ${name}\n`, 'utf8')
  await git(repositoryRoot, ['add', 'README.md'])
  await git(repositoryRoot, ['commit', '-m', 'Initial fixture'])
}

async function git(cwd: string, args: readonly string[]): Promise<string> {
  const result = await execute('git', ['-C', cwd, ...args], { windowsHide: true })
  return result.stdout.trim()
}
