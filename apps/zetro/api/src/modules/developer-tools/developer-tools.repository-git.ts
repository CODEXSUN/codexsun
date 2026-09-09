import { execFile, spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import type {
  GitBlameLine,
  GitBranchSummary,
  GitChangedFile,
  GitConflictFile,
  GitFileDiff,
  GitFileHistoryEntry,
  GitStashSummary,
} from './developer-tools.types.js'
import { DeveloperToolCommandError } from './developer-tools.git.js'

const executeFile = promisify(execFile)
const options = { maxBuffer: 8_000_000, windowsHide: true } as const

export async function listChangedFiles(repositoryPath: string): Promise<GitChangedFile[]> {
  const output = await git(repositoryPath, ['status', '--porcelain=v1', '-z'])
  const entries = output.split('\0').filter(Boolean)
  const files: GitChangedFile[] = []
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index] ?? ''
    const indexStatus = entry[0] ?? ' '
    const worktreeStatus = entry[1] ?? ' '
    let path = entry.slice(3)
    if ((indexStatus === 'R' || indexStatus === 'C') && entries[index + 1]) {
      path = entries[index + 1] ?? path
      index += 1
    }
    files.push({
      conflict:
        indexStatus === 'U' ||
        worktreeStatus === 'U' ||
        (indexStatus !== worktreeStatus &&
          ['A', 'D'].includes(indexStatus) &&
          ['A', 'D'].includes(worktreeStatus)),
      indexStatus,
      path,
      worktreeStatus,
    })
  }
  return files
}

export async function readFileDiff(
  repositoryPath: string,
  filePath: string,
  staged: boolean,
): Promise<GitFileDiff> {
  const safePath = await validateChangedPath(repositoryPath, filePath)
  const args = [
    'diff',
    '--no-ext-diff',
    '--no-color',
    staged ? '--cached' : '',
    '--',
    safePath,
  ].filter(Boolean)
  const patch = await git(repositoryPath, args)
  const before = await optionalGit(repositoryPath, ['show', `HEAD:${safePath}`])
  const absolutePath = resolve(repositoryPath, safePath)
  const after = await readFile(absolutePath, 'utf8').catch(() => '')
  return { after, before, hunks: countHunks(patch), patch, path: safePath, staged }
}

export async function stageChange(
  repositoryPath: string,
  filePath: string,
  staged: boolean,
  hunk?: number,
) {
  const safePath = await validateChangedPath(repositoryPath, filePath)
  if (hunk === undefined) {
    await git(
      repositoryPath,
      staged ? ['add', '--', safePath] : ['restore', '--staged', '--', safePath],
    )
    return
  }
  const patch = await git(repositoryPath, [
    'diff',
    '--no-ext-diff',
    '--no-color',
    '--unified=0',
    ...(staged ? [] : ['--cached']),
    '--',
    safePath,
  ])
  const selected = selectHunk(patch, hunk)
  await gitWithInput(
    repositoryPath,
    ['apply', '--unidiff-zero', '--cached', ...(staged ? [] : ['--reverse'])],
    selected,
  )
}

export async function readFileHistory(
  repositoryPath: string,
  filePath: string,
): Promise<GitFileHistoryEntry[]> {
  const safePath = validateRelativePath(repositoryPath, filePath)
  const output = await git(repositoryPath, [
    'log',
    '-50',
    '--follow',
    '--format=%H%x1f%h%x1f%s%x1f%aI%x1f%an',
    '--',
    safePath,
  ])
  return lines(output).map((line) => {
    const [hash = '', shortHash = '', subject = '', authoredAt = '', author = ''] =
      line.split('\u001f')
    return { author, authoredAt, hash, shortHash, subject }
  })
}

export async function readFileBlame(
  repositoryPath: string,
  filePath: string,
): Promise<GitBlameLine[]> {
  const safePath = validateRelativePath(repositoryPath, filePath)
  const output = await git(repositoryPath, ['blame', '--line-porcelain', '--', safePath])
  return parseBlame(output)
}

export async function listConflicts(repositoryPath: string): Promise<GitConflictFile[]> {
  const output = await git(repositoryPath, ['diff', '--name-only', '--diff-filter=U', '-z'])
  return Promise.all(
    output
      .split('\0')
      .filter(Boolean)
      .map(async (path) => ({
        content: await readFile(
          resolve(repositoryPath, validateRelativePath(repositoryPath, path)),
          'utf8',
        ),
        path,
      })),
  )
}

export async function resolveConflict(
  repositoryPath: string,
  filePath: string,
  resolution: 'ours' | 'theirs' | 'manual',
  content?: string,
) {
  const safePath = validateRelativePath(repositoryPath, filePath)
  const conflicts = await git(repositoryPath, ['diff', '--name-only', '--diff-filter=U', '-z'])
  if (!conflicts.split('\0').includes(safePath))
    throw new DeveloperToolCommandError('The file is not conflicted.')
  if (resolution === 'manual') {
    if (content === undefined)
      throw new DeveloperToolCommandError('Manual conflict content is required.')
    await writeFile(resolve(repositoryPath, safePath), content, 'utf8')
  } else await git(repositoryPath, ['checkout', `--${resolution}`, '--', safePath])
  await git(repositoryPath, ['add', '--', safePath])
}

export async function listBranches(repositoryPath: string): Promise<GitBranchSummary[]> {
  const current = await git(repositoryPath, ['branch', '--show-current'])
  const merged = new Set(
    lines(await git(repositoryPath, ['branch', '--format=%(refname:short)', '--merged', 'HEAD'])),
  )
  return lines(await git(repositoryPath, ['branch', '--format=%(refname:short)'])).map((name) => ({
    current: name === current,
    merged: merged.has(name),
    name,
  }))
}

export async function deleteMergedBranch(repositoryPath: string, branch: string) {
  const branches = await listBranches(repositoryPath)
  const candidate = branches.find((item) => item.name === branch)
  if (!candidate || candidate.current || !candidate.merged) {
    throw new DeveloperToolCommandError('Only a merged, non-current local branch can be deleted.')
  }
  await git(repositoryPath, ['branch', '--delete', branch])
}

export async function listStashes(repositoryPath: string): Promise<GitStashSummary[]> {
  const output = await git(repositoryPath, ['stash', 'list', '--format=%gd%x1f%s'])
  return lines(output).map((line, index) => {
    const [reference = `stash@{${index}}`, message = ''] = line.split('\u001f')
    return { index, message, reference }
  })
}

export async function changeStash(
  repositoryPath: string,
  action: 'create' | 'apply' | 'drop',
  index?: number,
  message?: string,
) {
  if (action === 'create') {
    await git(repositoryPath, [
      'stash',
      'push',
      '--include-untracked',
      '-m',
      message || 'Zetro stash',
    ])
    return
  }
  const reference = `stash@{${index ?? 0}}`
  await git(repositoryPath, ['stash', action, reference])
}

export async function createPullRequest(
  repositoryPath: string,
  input: { base: string; body: string; draft: boolean; title: string },
) {
  const args = ['pr', 'create', '--base', input.base, '--title', input.title, '--body', input.body]
  if (input.draft) args.push('--draft')
  return execute(repositoryPath, 'gh', args)
}

async function validateChangedPath(repositoryPath: string, filePath: string) {
  const safePath = validateRelativePath(repositoryPath, filePath)
  const changed = await listChangedFiles(repositoryPath)
  if (!changed.some((file) => file.path === safePath))
    throw new DeveloperToolCommandError('The file is not changed.')
  return safePath
}

function validateRelativePath(repositoryPath: string, filePath: string) {
  const normalized = filePath.replaceAll('\\', '/')
  const target = resolve(repositoryPath, normalized)
  const relation = relative(resolve(repositoryPath), target)
  if (isAbsolute(normalized) || !relation || relation.startsWith('..') || isAbsolute(relation)) {
    throw new DeveloperToolCommandError('Use a repository-relative file path.')
  }
  return normalized
}

function selectHunk(patch: string, index: number) {
  const firstHunk = patch.search(/^@@/m)
  if (firstHunk < 0) throw new DeveloperToolCommandError('The file has no selectable text hunks.')
  const header = patch.slice(0, firstHunk)
  const hunks = patch.slice(firstHunk).split(/(?=^@@)/m)
  if (!hunks[index]) throw new DeveloperToolCommandError('The selected hunk does not exist.')
  return `${header}${hunks[index]}`
}

function countHunks(patch: string) {
  return (patch.match(/^@@/gm) ?? []).length
}

function parseBlame(output: string): GitBlameLine[] {
  const result: GitBlameLine[] = []
  let commit = ''
  let line = 0
  let author = ''
  let authoredAt = ''
  for (const value of output.split(/\r?\n/)) {
    const header = value.match(/^([0-9a-f^]{40}) \d+ (\d+)/)
    if (header) {
      commit = header[1] ?? ''
      line = Number(header[2])
    } else if (value.startsWith('author ')) author = value.slice(7)
    else if (value.startsWith('author-time '))
      authoredAt = new Date(Number(value.slice(12)) * 1_000).toISOString()
    else if (value.startsWith('\t'))
      result.push({ author, authoredAt, commit, content: value.slice(1), line })
  }
  return result
}

async function git(repositoryPath: string, args: string[]) {
  return execute(repositoryPath, 'git', ['-C', repositoryPath, ...args])
}

async function optionalGit(repositoryPath: string, args: string[]) {
  try {
    return await git(repositoryPath, args)
  } catch {
    return ''
  }
}

async function execute(repositoryPath: string, command: string, args: string[]) {
  try {
    const result = await executeFile(command, args, { ...options, cwd: repositoryPath })
    return result.stdout.trim()
  } catch (error) {
    throw new DeveloperToolCommandError(commandError(error))
  }
}

async function gitWithInput(repositoryPath: string, args: string[], input: string) {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn('git', ['-C', repositoryPath, ...args], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let error = ''
    child.stderr.on('data', (chunk) => {
      error += String(chunk)
    })
    child.on('error', reject)
    child.on('close', (code) =>
      code === 0
        ? resolvePromise()
        : reject(new DeveloperToolCommandError(error.trim() || 'Git patch failed.')),
    )
    child.stdin.end(input)
  })
}

function commandError(error: unknown) {
  if (typeof error === 'object' && error !== null && 'stderr' in error) {
    const stderr = String(error.stderr).trim()
    if (stderr) return stderr.replace(/^fatal:\s*/i, '')
  }
  return error instanceof Error ? error.message : 'Command failed.'
}

function lines(value: string) {
  return value ? value.split(/\r?\n/).filter(Boolean) : []
}
