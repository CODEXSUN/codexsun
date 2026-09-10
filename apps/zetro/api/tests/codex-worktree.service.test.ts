import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import { CodexWorktreeService } from '../src/modules/codex-connection/codex-worktree.service.js'

const execute = promisify(execFile)

test('rejects indirect, absolute, and Git metadata scope before filesystem resolution', async () => {
  const service = new CodexWorktreeService(process.cwd(), process.cwd())
  for (const path of [
    'apps/platform/../zetro',
    'apps//platform',
    '.',
    'C:/outside',
    '/outside',
    '.git',
  ]) {
    await assert.rejects(
      service.resolveWorkingDirectory(process.cwd(), path),
      /direct relative worktree folder/,
    )
  }
})

test('resolves a redirected worktree root before checking Git ownership', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'zetro-redirected-'))
  const repositoryRoot = join(temporaryRoot, 'repository')
  const physicalRoot = join(temporaryRoot, 'physical')
  const linkedRoot = join(temporaryRoot, 'linked')
  try {
    await git(temporaryRoot, ['init', repositoryRoot])
    await git(repositoryRoot, ['config', 'user.email', 'zetro@example.test'])
    await git(repositoryRoot, ['config', 'user.name', 'Zetro Test'])
    await writeFile(join(repositoryRoot, 'README.md'), '# Fixture\n')
    await git(repositoryRoot, ['add', 'README.md'])
    await git(repositoryRoot, ['commit', '-m', 'Fixture'])
    await mkdir(physicalRoot)
    await symlink(physicalRoot, linkedRoot, process.platform === 'win32' ? 'junction' : 'dir')
    const service = new CodexWorktreeService(repositoryRoot, linkedRoot)
    const id = '11111111-1111-4111-8111-111111111111'
    const worktree = await service.ensure(id)
    assert.equal(worktree.path, await realpath(join(physicalRoot, id)))
    await service.remove(worktree.path)
  } finally {
    await rm(linkedRoot, { recursive: true, force: true })
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})

test('checks out long desktop worktree paths without changing repository config', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'zetro-long-path-'))
  const repositoryRoot = join(temporaryRoot, 'repository')
  const worktreeRoot = join(temporaryRoot, 'desktop-'.repeat(10), 'projects-'.repeat(3))
  const moduleFolder = 'module-'.repeat(12)
  try {
    await git(temporaryRoot, ['init', repositoryRoot])
    await git(repositoryRoot, ['config', 'user.email', 'zetro@example.test'])
    await git(repositoryRoot, ['config', 'user.name', 'Zetro Test'])
    await mkdir(join(repositoryRoot, moduleFolder))
    await writeFile(join(repositoryRoot, moduleFolder, 'README.md'), '# Long path fixture\n')
    await git(repositoryRoot, ['add', moduleFolder])
    await git(repositoryRoot, ['commit', '-m', 'Fixture'])
    const service = new CodexWorktreeService(repositoryRoot, worktreeRoot)
    const worktree = await service.ensure('11111111-1111-4111-8111-111111111111')
    const file = join(worktree.path, moduleFolder, 'README.md')
    assert.ok(file.length > 260)
    assert.equal((await readFile(file, 'utf8')).trim(), '# Long path fixture')
    await service.remove(worktree.path)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})

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
    const workingDirectory = await service.resolveWorkingDirectory(worktree.path, 'apps/zetro')

    assert.equal(worktree.path, selectedWorktree)
    assert.equal(workingDirectory, join(selectedWorktree, 'apps', 'zetro'))
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
  await mkdir(join(repositoryRoot, 'apps', 'zetro'), { recursive: true })
  await writeFile(join(repositoryRoot, 'apps', 'zetro', 'README.md'), `# ${name} app\n`, 'utf8')
  await git(repositoryRoot, ['add', '.'])
  await git(repositoryRoot, ['commit', '-m', 'Initial fixture'])
}

test('prepares empty scoped folders without copying files or replacing older work', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'zetro-prepare-'))
  const repositoryRoot = join(temporaryRoot, 'repository')
  try {
    await initializeRepository(repositoryRoot, 'prepare')
    const service = new CodexWorktreeService(repositoryRoot, join(temporaryRoot, 'tasks'))
    const worktree = await service.ensure('11111111-1111-4111-8111-111111111111')
    for (const path of ['apps/sites', 'packages/new-ui', 'assist/records/sites']) {
      await mkdir(join(repositoryRoot, path), { recursive: true })
      const prepared = await service.prepareWorkingDirectory(worktree.path, path)
      assert.equal(prepared, join(worktree.path, path))
      await writeFile(join(prepared, 'draft.md'), 'Keep my work')
      assert.equal(await service.prepareWorkingDirectory(worktree.path, path), prepared)
      assert.equal(await readFile(join(prepared, 'draft.md'), 'utf8'), 'Keep my work')
    }
    await mkdir(join(repositoryRoot, 'apps/uncommitted'), { recursive: true })
    await writeFile(join(repositoryRoot, 'apps/uncommitted/code.ts'), 'export {}')
    await assert.rejects(
      service.prepareWorkingDirectory(worktree.path, 'apps/uncommitted'),
      /Commit them/,
    )
    await mkdir(join(repositoryRoot, 'apps/later'), { recursive: true })
    await writeFile(join(repositoryRoot, 'apps/later/README.md'), 'Later commit')
    await git(repositoryRoot, ['add', 'apps/later'])
    await git(repositoryRoot, ['commit', '-m', 'Later folder'])
    await rm(join(repositoryRoot, 'apps/later/README.md'))
    await assert.rejects(
      service.prepareWorkingDirectory(worktree.path, 'apps/later'),
      /tracked but missing/,
    )
    for (const path of ['apps/no/module', 'apps/../escape', '../escape']) {
      await assert.rejects(service.prepareWorkingDirectory(worktree.path, path))
    }
    await mkdir(join(repositoryRoot, 'assist/redirected'), { recursive: true })
    await mkdir(join(temporaryRoot, 'outside'))
    await symlink(
      join(temporaryRoot, 'outside'),
      join(worktree.path, 'assist/redirected'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    await assert.rejects(
      service.prepareWorkingDirectory(worktree.path, 'assist/redirected'),
      /physical directory/,
    )
    await rm(join(worktree.path, 'assist/redirected'))
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})

async function git(cwd: string, args: readonly string[]): Promise<string> {
  const result = await execute('git', ['-C', cwd, ...args], { windowsHide: true })
  return result.stdout.trim()
}
