import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, dirname, relative, resolve } from 'node:path'
import type { WorktreePreparation, WorktreeService } from '../application/coding-worker.ports.js'

export class GitWorktreeService implements WorktreeService {
  prepare(input: {
    branchName: string
    modulePath: string
    repositoryPath: string
    worktreePath: string
  }): WorktreePreparation {
    const repositoryPath = repositoryRoot(input.repositoryPath)
    const scope = approvedModulePath(repositoryPath, input.modulePath)
    const worktreePath = resolve(input.worktreePath)
    if (existsSync(worktreePath)) throw new Error('The planned worktree path already exists.')
    runGit(repositoryPath, ['worktree', 'add', '-b', input.branchName, worktreePath, 'HEAD'])
    try {
      createMissingAppScope(repositoryPath, worktreePath, scope.modulePath)
      return {
        branchName: input.branchName,
        modulePath: scope.modulePath,
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

  cleanup(input: { branchName: string; repositoryPath: string; worktreePath: string }) {
    const repositoryPath = repositoryRoot(input.repositoryPath)
    const worktreePath = approvedWorktreePath(repositoryPath, input.worktreePath)
    if (existsSync(worktreePath)) runGit(repositoryPath, ['worktree', 'remove', '--force', worktreePath])
    runGit(repositoryPath, ['branch', '--delete', '--force', input.branchName])
  }

  integrate(input: { modulePath: string; repositoryPath: string; worktreePath: string }) {
    const repositoryPath = repositoryRoot(input.repositoryPath)
    const worktreePath = approvedWorktreePath(repositoryPath, input.worktreePath)
    const scope = approvedModulePath(repositoryPath, input.modulePath)
    const source = resolve(worktreePath, scope.modulePath)
    const target = resolve(repositoryPath, scope.modulePath)
    if (!existsSync(source)) throw new Error('The approved worker scope no longer exists.')
    if (existsSync(target) && !directoriesMatch(source, target)) {
      throw new Error('The main checkout scope changed. Review and integrate it manually to avoid overwrite.')
    }
    if (!existsSync(target)) cpSync(source, target, { recursive: true })
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
  const normalized = location.replaceAll('\\', '/')
  if (existsSync(modulePath)) return { modulePath: normalized }
  if (canCreateAppScope(repositoryPath, normalized)) return { modulePath: normalized }
  throw new Error('The approved module path does not exist.')
}

function createMissingAppScope(repositoryPath: string, worktreePath: string, modulePath: string) {
  const worktreeModulePath = resolve(worktreePath, modulePath)
  if (existsSync(worktreeModulePath)) return
  if (!canCreateAppScope(repositoryPath, modulePath)) {
    throw new Error('The approved module path is missing from the isolated worktree.')
  }
  mkdirSync(worktreeModulePath, { recursive: true })
}

function canCreateAppScope(repositoryPath: string, modulePath: string) {
  const parts = modulePath.split('/')
  return parts.length === 2 && parts[0] === 'apps' && Boolean(parts[1]) && existsSync(resolve(repositoryPath, 'apps'))
}

function approvedWorktreePath(repositoryPath: string, candidate: string) {
  const expectedRoot = resolve(dirname(repositoryPath), `.${basename(repositoryPath)}-zetro-worktrees`)
  const worktreePath = resolve(candidate)
  const location = relative(expectedRoot, worktreePath)
  if (!location || location.startsWith('..') || location.includes(':')) {
    throw new Error('The worker worktree is outside the approved Zetro worktree root.')
  }
  return worktreePath
}

function directoriesMatch(source: string, target: string): boolean {
  const sourceEntries = readdirSync(source).sort()
  const targetEntries = readdirSync(target).sort()
  if (sourceEntries.join('\0') !== targetEntries.join('\0')) return false
  return sourceEntries.every((entry) => {
    const sourcePath = resolve(source, entry)
    const targetPath = resolve(target, entry)
    const sourceStat = statSync(sourcePath)
    const targetStat = statSync(targetPath)
    if (sourceStat.isDirectory() !== targetStat.isDirectory()) return false
    if (sourceStat.isDirectory()) return directoriesMatch(sourcePath, targetPath)
    return readFileSync(sourcePath).equals(readFileSync(targetPath))
  })
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
