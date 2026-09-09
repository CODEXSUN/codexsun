import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  compareGitBranch,
  readGitStatus,
  runGitAction,
} from '../src/modules/developer-tools/developer-tools.git.js'

test('developer tools inspect, branch, commit, push, compare, and revert', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-tools-'))
  const repository = join(root, 'work')
  const remote = join(root, 'remote.git')
  try {
    git(root, ['init', '--bare', remote])
    git(root, ['init', '-b', 'main', repository])
    git(repository, ['config', 'user.email', 'zetro@example.test'])
    git(repository, ['config', 'user.name', 'Zetro Test'])
    await writeFile(join(repository, 'README.md'), '# Test\n', 'utf8')
    git(repository, ['add', 'README.md'])
    git(repository, ['commit', '-m', 'Initial commit'])
    const baseCommit = git(repository, ['rev-parse', 'HEAD'])
    git(repository, ['remote', 'add', 'origin', remote])
    await runGitAction(repository, { action: 'branch', branch: 'codex/tooling' })

    await writeFile(join(repository, 'tooling.txt'), 'developer tools\n', 'utf8')
    const dirty = await readGitStatus(repository)
    assert.equal(dirty.branch, 'codex/tooling')
    assert.equal(dirty.files, 1)
    assert.equal(dirty.untracked, 1)

    await runGitAction(repository, { action: 'commit', message: 'Add tooling', stageAll: true })
    const comparison = await compareGitBranch(repository, baseCommit)
    assert.equal(comparison.commitsAhead, 1)
    assert.equal(comparison.files[0]?.path, 'tooling.txt')

    await runGitAction(repository, { action: 'push', forceWithLease: false })
    const pushed = await readGitStatus(repository)
    assert.equal(pushed.upstream, 'origin/codex/tooling')
    assert.equal(pushed.ahead, 0)

    const commit = git(repository, ['rev-parse', 'HEAD'])
    await runGitAction(repository, { action: 'revert', commit })
    assert.equal((await readGitStatus(repository)).files, 0)
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

test('developer tools pull with rebase or merge', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zetro-tools-sync-'))
  const remote = join(root, 'remote.git')
  const seed = join(root, 'seed')
  const local = join(root, 'local')
  const peer = join(root, 'peer')
  try {
    git(root, ['init', '--bare', remote])
    git(root, ['init', '-b', 'main', seed])
    configureAuthor(seed)
    await writeFile(join(seed, 'README.md'), '# Test\n', 'utf8')
    git(seed, ['add', 'README.md'])
    git(seed, ['commit', '-m', 'Initial commit'])
    git(seed, ['remote', 'add', 'origin', remote])
    git(seed, ['push', '--set-upstream', 'origin', 'main'])
    git(remote, ['symbolic-ref', 'HEAD', 'refs/heads/main'])
    git(root, ['clone', remote, local])
    git(root, ['clone', remote, peer])
    configureAuthor(peer)

    await writeFile(join(peer, 'rebase.txt'), 'rebase\n', 'utf8')
    git(peer, ['add', 'rebase.txt'])
    git(peer, ['commit', '-m', 'Add rebase fixture'])
    git(peer, ['push'])
    await runGitAction(local, { action: 'sync', strategy: 'rebase' })
    assert.equal(git(local, ['log', '-1', '--pretty=%s']), 'Add rebase fixture')

    await writeFile(join(peer, 'merge.txt'), 'merge\n', 'utf8')
    git(peer, ['add', 'merge.txt'])
    git(peer, ['commit', '-m', 'Add merge fixture'])
    git(peer, ['push'])
    await runGitAction(local, { action: 'sync', strategy: 'merge' })
    assert.equal(git(local, ['log', '-1', '--pretty=%s']), 'Add merge fixture')
  } finally {
    await rm(root, { force: true, recursive: true })
  }
})

function git(cwd: string, args: string[]) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', windowsHide: true }).trim()
}

function configureAuthor(repository: string) {
  git(repository, ['config', 'user.email', 'zetro@example.test'])
  git(repository, ['config', 'user.name', 'Zetro Test'])
}
