import { execFile } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { promisify } from 'node:util'
import type {
  GitComparison,
  GitDeliverySnapshot,
  GitWorkspaceStatus,
} from './developer-tools.types.js'

const executeFile = promisify(execFile)
const gitOptions = { maxBuffer: 4_000_000, windowsHide: true } as const

export class DeveloperToolCommandError extends Error {}

export async function readGitStatus(repositoryPath: string): Promise<GitWorkspaceStatus> {
  const startedAt = performance.now()
  const [branch, status, upstream, counts, log, numstat] = await Promise.all([
    git(repositoryPath, ['branch', '--show-current']),
    git(repositoryPath, ['status', '--porcelain=v1']),
    optionalGit(repositoryPath, ['rev-parse', '--abbrev-ref', '@{upstream}']),
    optionalGit(repositoryPath, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']),
    git(repositoryPath, ['log', '-8', '--pretty=format:%H%x1f%h%x1f%s%x1f%aI']),
    optionalGit(repositoryPath, ['diff', 'HEAD', '--numstat', '--']),
  ])
  const lines = splitLines(status)
  const [ahead = 0, behind = 0] = counts ? counts.split(/\s+/).map(Number) : [0, 0]
  const totals = sumNumstat(numstat)
  return {
    additions: totals.additions,
    ahead,
    behind,
    branch: branch || 'Detached HEAD',
    deletions: totals.deletions,
    detached: !branch,
    files: lines.length,
    generatedAt: new Date().toISOString(),
    latencyMs: Math.max(1, Math.round(performance.now() - startedAt)),
    recentCommits: splitLines(log).map((line) => {
      const [hash = '', shortHash = '', subject = '', authoredAt = ''] = line.split('\u001f')
      return { authoredAt, hash, shortHash, subject }
    }),
    staged: lines.filter((line) => line[0] !== ' ' && line[0] !== '?').length,
    untracked: lines.filter((line) => line.startsWith('??')).length,
    unstaged: lines.filter((line) => line[1] !== ' ' && line[1] !== '?').length,
    upstream,
  }
}

export async function compareGitBranch(
  repositoryPath: string,
  baseBranch: string,
): Promise<GitComparison> {
  await git(repositoryPath, ['rev-parse', '--verify', `${baseBranch}^{commit}`])
  const [headBranch, commitsAhead, nameStatus, numstat] = await Promise.all([
    git(repositoryPath, ['branch', '--show-current']),
    git(repositoryPath, ['rev-list', '--count', `${baseBranch}..HEAD`]),
    git(repositoryPath, ['diff', '--name-status', '--find-renames', `${baseBranch}...HEAD`, '--']),
    git(repositoryPath, ['diff', '--numstat', `${baseBranch}...HEAD`, '--']),
  ])
  const totals = sumNumstat(numstat)
  return {
    additions: totals.additions,
    baseBranch,
    commitsAhead: Number(commitsAhead),
    deletions: totals.deletions,
    files: splitLines(nameStatus).map((line) => {
      const [status = '', ...pathParts] = line.split('\t')
      return { path: pathParts.join(' → '), status }
    }),
    headBranch: headBranch || 'Detached HEAD',
  }
}

export async function readGitDeliverySnapshot(
  repositoryPath: string,
): Promise<GitDeliverySnapshot> {
  const [branch, changed, head, remoteUrl, upstream] = await Promise.all([
    git(repositoryPath, ['branch', '--show-current']),
    git(repositoryPath, ['status', '--porcelain=v1']),
    git(repositoryPath, ['rev-parse', 'HEAD']),
    optionalGit(repositoryPath, ['remote', 'get-url', 'origin']),
    optionalGit(repositoryPath, ['rev-parse', '--abbrev-ref', '@{upstream}']),
  ])
  return {
    branch: branch || 'Detached HEAD',
    changedFiles: splitLines(changed).map(readStatusPath).sort(),
    head,
    remoteUrl: remoteUrl || null,
    upstream: upstream || null,
  }
}

export async function runGitAction(
  repositoryPath: string,
  action:
    | { action: 'fetch' }
    | { action: 'sync'; strategy: 'merge' | 'rebase' }
    | { action: 'branch'; branch: string }
    | { action: 'commit'; message: string; stageAll: boolean }
    | { action: 'push'; forceWithLease: boolean }
    | { action: 'revert'; commit: string },
): Promise<string> {
  if (action.action === 'fetch') return git(repositoryPath, ['fetch', '--prune'])
  if (action.action === 'sync') {
    const upstream = await optionalGit(repositoryPath, ['rev-parse', '--abbrev-ref', '@{upstream}'])
    if (!upstream) throw new DeveloperToolCommandError('Set an upstream branch before pulling.')
    await git(repositoryPath, ['fetch', '--prune'])
    return git(repositoryPath, [
      'pull',
      action.strategy === 'rebase' ? '--rebase' : '--no-rebase',
      '--autostash',
    ])
  }
  if (action.action === 'branch') return git(repositoryPath, ['switch', '-c', action.branch])
  if (action.action === 'commit') {
    if (action.stageAll) await git(repositoryPath, ['add', '--all'])
    return git(repositoryPath, ['commit', '-m', action.message])
  }
  if (action.action === 'push') {
    const force = action.forceWithLease ? ['--force-with-lease'] : []
    const upstream = await optionalGit(repositoryPath, ['rev-parse', '--abbrev-ref', '@{upstream}'])
    if (upstream) return git(repositoryPath, ['push', ...force])
    const branch = await git(repositoryPath, ['branch', '--show-current'])
    if (!branch)
      throw new DeveloperToolCommandError('Create a branch before pushing a detached HEAD.')
    const remotes = splitLines(await git(repositoryPath, ['remote']))
    const remote = remotes.includes('origin') ? 'origin' : remotes[0]
    if (!remote) throw new DeveloperToolCommandError('Add a Git remote before pushing this branch.')
    return git(repositoryPath, ['push', '--set-upstream', remote, branch, ...force])
  }
  return git(repositoryPath, ['revert', '--no-edit', action.commit])
}

async function git(repositoryPath: string, args: string[]): Promise<string> {
  try {
    const result = await executeFile('git', ['-C', repositoryPath, ...args], gitOptions)
    return result.stdout.trim()
  } catch (error) {
    throw new DeveloperToolCommandError(readCommandError(error))
  }
}

async function optionalGit(repositoryPath: string, args: string[]): Promise<string> {
  try {
    return await git(repositoryPath, args)
  } catch {
    return ''
  }
}

function readCommandError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'stderr' in error) {
    const stderr = String(error.stderr).trim()
    if (stderr) return stderr.replace(/^fatal:\s*/i, '')
  }
  return error instanceof Error ? error.message : 'Git command failed.'
}

function splitLines(value: string): string[] {
  return value ? value.split(/\r?\n/).filter(Boolean) : []
}

function readStatusPath(line: string): string {
  const value = line.slice(3).trim()
  const renamedPath = value.split(' -> ').at(-1) ?? value
  return renamedPath.replace(/^"|"$/gu, '')
}

function sumNumstat(value: string) {
  return splitLines(value).reduce(
    (totals, line) => {
      const [added, deleted] = line.split('\t')
      totals.additions += Number(added) || 0
      totals.deletions += Number(deleted) || 0
      return totals
    },
    { additions: 0, deletions: 0 },
  )
}
