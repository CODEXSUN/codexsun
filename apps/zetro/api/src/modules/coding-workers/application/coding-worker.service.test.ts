import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import type { AgentTaskDraft } from '@codexsun/zetro-contracts'
import { CodingWorkerRepository } from '../infrastructure/coding-worker.repository.js'
import { GitWorktreeService } from '../infrastructure/git-worktree.service.js'
import { CodingWorkerService } from './coding-worker.service.js'

test('prepares an isolated branch and worktree for a confirmed daily coding handoff', () => {
  const directory = mkdtempSync(join(tmpdir(), 'zetro-coding-worker-test-'))
  const repositoryPath = join(directory, 'repository')
  try {
    initializeRepository(repositoryPath)
    const repository = new CodingWorkerRepository(join(directory, 'zetro.sqlite'))
    const taskSource = createTaskSource(repositoryPath)
    const service = new CodingWorkerService(taskSource, new GitWorktreeService(), repository)
    const attempt = service.prepare({
      taskId: taskSource.get('task-1').id,
    })
    assert.equal(attempt.status, 'prepared')
    assert.equal(attempt.runtime, 'isolated-worktree')
    assert.match(attempt.branchName, /^codex\/zetro-task-/)
    assert.ok(existsSync(attempt.worktreePath))
    assert.equal(service.list()[0]?.revision, attempt.revision)
    const verified = service.verify(attempt.id)
    assert.equal(verified.approvalStatus, 'awaiting-approval')
    assert.equal(verified.verification[0]?.passed, true)
    const approved = service.approve(attempt.id)
    assert.equal(approved.approvalStatus, 'approved')
    execGit(repositoryPath, ['worktree', 'remove', '--force', attempt.worktreePath])
    execGit(repositoryPath, ['branch', '--delete', '--force', attempt.branchName])
    service.close()
  } finally {
    rmSync(directory, { force: true, maxRetries: 3, recursive: true, retryDelay: 20 })
  }
})

function createTaskSource(repositoryPath: string) {
  return {
    get(_taskId: string): AgentTaskDraft {
      return {
        approvalStatus: 'awaiting-approval',
        acceptanceCriteria: ['The health response includes the requested field.'],
        checks: ['git diff --check'],
        createdAt: 1,
        id: 'a0b0c0d0-1111-4111-8111-111111111111',
        originConversationId: 'a0b0c0d0-1111-4111-8111-111111111111',
        originTurnId: '48a7f6ea-3793-49da-b846-02592c2f2223',
        modulePath: 'apps/example',
        repositoryPath,
        reviewConfirmedAt: 1,
        sourcePrompt: 'Build the approved feature',
        sourceResponse: 'Use one approved scope.',
        status: 'draft',
        title: 'Build the approved feature',
        updatedAt: 1,
      }
    },
  }
}

function initializeRepository(repositoryPath: string) {
  execGit(process.cwd(), ['init', repositoryPath])
  execGit(repositoryPath, ['config', 'user.email', 'test@zetro.local'])
  execGit(repositoryPath, ['config', 'user.name', 'Zetro Test'])
  mkdirSync(join(repositoryPath, 'apps', 'example'), { recursive: true })
  writeFileSync(join(repositoryPath, 'package.json'), '{"name":"example"}\n')
  execGit(repositoryPath, ['add', '.'])
  execGit(repositoryPath, ['commit', '-m', 'Initial commit'])
}

function execGit(cwd: string, arguments_: string[]) {
  return execFileSync('git', ['-C', cwd, ...arguments_], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
}
