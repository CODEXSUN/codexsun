import { execFileSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import type { WorktreePreparation, WorktreeService } from '../application/coding-worker.ports.js'

export class GitWorktreeService implements WorktreeService {
  prepare(input: {
    branchName: string
    modulePath: string
    repositoryPath: string
    worktreePath: string
  }): WorktreePreparation {
    const repositoryPath = repositoryRoot(input.repositoryPath)
    const modulePath = approvedModulePath(repositoryPath, input.modulePath)
    const worktreePath = resolve(input.worktreePath)
    if (existsSync(worktreePath)) throw new Error('The planned worktree path already exists.')
    runGit(repositoryPath, ['worktree', 'add', '-b', input.branchName, worktreePath, 'HEAD'])
    try {
      return {
        branchName: input.branchName,
        modulePath,
        repositoryPath,
        revision: runGit(worktreePath, ['rev-parse', 'HEAD']).trim(),
        runtime: 'isolated-worktree',
        status: 'prepared',
        toolProfile: 'daily-coding',
        worktreePath,
      }
    } catch (error) {
      runGit(repositoryPath, ['worktree', 'remove', '--force', worktreePath])
      runGit(repositoryPath, ['branch', '--delete', '--force', input.branchName])
      throw error
    }
  }
}

function repositoryRoot(candidate: string) {
  const path = resolve(candidate)
  if (!existsSync(path)) throw new Error('The selected repository path does not exist.')
  return realpathSync.native(runGit(path, ['rev-parse', '--show-toplevel']).trim())
}

function approvedModulePath(repositoryPath: string, candidate: string) {
  const modulePath = resolve(repositoryPath, candidate)
  const location = relative(repositoryPath, modulePath)
  if (!location || location.startsWith('..') || location.includes(':')) {
    throw new Error('The approved module must be inside the selected repository.')
  }
  if (!existsSync(modulePath)) throw new Error('The approved module path does not exist.')
  return location.replaceAll('\\', '/')
}

function runGit(cwd: string, arguments_: string[]) {
  try {
    return execFileSync('git', ['-C', cwd, ...arguments_], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Git could not prepare the worktree.'
    throw new Error(`Git worktree preparation failed: ${detail}`)
  }
}
