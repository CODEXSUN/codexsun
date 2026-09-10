import { spawn } from 'node:child_process'
import { lstat, mkdir, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'

export interface CodexWorktree {
  path: string
  revision: string
}

export interface CodexWorktreeStatus {
  conversationId: string
  dirty: boolean
  modifiedAt: string
  path: string
  projectId: string | null
  sizeBytes: number
}

export class CodexWorktreeService {
  private readonly pending = new Map<string, Promise<CodexWorktree>>()

  public constructor(
    private readonly repositoryRoot: string,
    private readonly worktreeRoot: string,
  ) {}

  public ensure(
    conversationId: string,
    repositoryRoot = this.repositoryRoot,
    projectId?: string,
  ): Promise<CodexWorktree> {
    const key = projectId ? `${projectId}:${conversationId}` : conversationId
    const existing = this.pending.get(key)
    if (existing) return existing

    const work = this.createOrLoad(conversationId, repositoryRoot, projectId).finally(() => {
      this.pending.delete(key)
    })
    this.pending.set(key, work)
    return work
  }

  public async writeInputs(
    conversationId: string,
    files: readonly { dataUrl: string; id: string; name: string }[],
    projectId?: string,
  ): Promise<readonly string[]> {
    if (files.length === 0) return []
    const inputRoot = resolve(
      this.worktreeRoot,
      '.inputs',
      ...(projectId ? [safeName(projectId)] : []),
      conversationId,
    )
    assertContainedPath(this.worktreeRoot, inputRoot)
    await mkdir(inputRoot, { recursive: true })

    return Promise.all(
      files.map(async (file) => {
        const filePath = join(inputRoot, `${safeName(file.id)}-${safeName(basename(file.name))}`)
        await writeFile(filePath, decodeDataUrl(file.dataUrl))
        return filePath
      }),
    )
  }

  public async resolveWorkingDirectory(worktreePath: string, folderPath: string): Promise<string> {
    const workingDirectory = resolve(worktreePath, folderPath)
    assertNestedPath(worktreePath, workingDirectory)
    if (!(await exists(workingDirectory))) {
      throw new Error('The connected folder is not available in the isolated worktree.')
    }
    return workingDirectory
  }

  public async list(): Promise<CodexWorktreeStatus[]> {
    const paths = await findWorktrees(this.worktreeRoot)
    return Promise.all(paths.map((path) => inspectWorktree(this.worktreeRoot, path)))
  }

  public async remove(path: string): Promise<void> {
    const target = await realpath(resolve(path))
    assertContainedPath(await realpath(this.worktreeRoot), target)
    const root = await runGit(target, ['rev-parse', '--show-toplevel'])
    if (!samePath(await realpath(root), await realpath(target)))
      throw new Error('The selected folder is not a Zetro worktree.')
    const status = await runGit(target, ['status', '--porcelain=v1'])
    if (status) throw new Error('Commit or discard worktree changes before cleanup.')
    const commonDirectory = await runGit(target, [
      'rev-parse',
      '--path-format=absolute',
      '--git-common-dir',
    ])
    await runGit(dirname(commonDirectory), ['worktree', 'remove', target])
    await runGit(dirname(commonDirectory), ['worktree', 'prune'])
  }

  public async sweep(retentionDays: number): Promise<CodexWorktreeStatus[]> {
    const cutoff = Date.now() - retentionDays * 86_400_000
    const removed: CodexWorktreeStatus[] = []
    for (const worktree of await this.list()) {
      if (worktree.dirty || Date.parse(worktree.modifiedAt) >= cutoff) continue
      await this.remove(worktree.path)
      removed.push(worktree)
    }
    return removed
  }

  private async createOrLoad(
    conversationId: string,
    repositoryRoot: string,
    projectId?: string,
  ): Promise<CodexWorktree> {
    const projectSegments =
      samePath(repositoryRoot, this.repositoryRoot) || !projectId ? [] : [safeName(projectId)]
    const worktreePath = resolve(this.worktreeRoot, ...projectSegments, conversationId)
    assertContainedPath(this.worktreeRoot, worktreePath)

    if (!(await exists(worktreePath))) {
      await mkdir(dirname(worktreePath), { recursive: true })
      await runGit(repositoryRoot, ['worktree', 'add', '--detach', worktreePath, 'HEAD'])
    }

    const root = await runGit(worktreePath, ['rev-parse', '--show-toplevel'])
    if (!samePath(await realpath(root), await realpath(worktreePath))) {
      throw new Error('The Zetro worktree path belongs to another repository checkout.')
    }

    return {
      path: await realpath(worktreePath),
      revision: await runGit(worktreePath, ['rev-parse', 'HEAD']),
    }
  }
}

async function findWorktrees(root: string): Promise<string[]> {
  if (!(await exists(root))) return []
  const result: string[] = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === '.inputs') continue
    const path = join(root, entry.name)
    if (await exists(join(path, '.git'))) result.push(path)
    else {
      for (const child of await readdir(path, { withFileTypes: true })) {
        const childPath = join(path, child.name)
        if (child.isDirectory() && (await exists(join(childPath, '.git')))) result.push(childPath)
      }
    }
  }
  return result
}

async function inspectWorktree(root: string, path: string): Promise<CodexWorktreeStatus> {
  const relation = relative(root, path).split(/[\\/]/u)
  const details = await stat(path)
  return {
    conversationId: relation.at(-1) ?? basename(path),
    dirty: Boolean(await runGit(path, ['status', '--porcelain=v1'])),
    modifiedAt: details.mtime.toISOString(),
    path,
    projectId: relation.length > 1 ? (relation[0] ?? null) : null,
    sizeBytes: await directorySize(path),
  }
}

async function directorySize(root: string): Promise<number> {
  let total = 0
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) total += await directorySize(path)
    else if (entry.isFile()) total += (await lstat(path)).size
  }
  return total
}

function samePath(left: string, right: string): boolean {
  return resolve(left).toLowerCase() === resolve(right).toLowerCase()
}

async function runGit(cwd: string, args: readonly string[]): Promise<string> {
  return new Promise((resolveCommand, reject) => {
    const child = spawn('git', ['-c', 'core.longpaths=true', '-C', cwd, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    let output = ''
    let errorOutput = ''
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (errorOutput += chunk.toString()))
    child.once('error', reject)
    child.once('exit', (code) => {
      if (code === 0) resolveCommand(output.trim())
      else reject(new Error(errorOutput.trim() || `Git exited with code ${code ?? 'unknown'}.`))
    })
  })
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false
    throw error
  }
}

function assertContainedPath(root: string, candidate: string): void {
  const relation = relative(resolve(root), resolve(candidate))
  if (!relation || relation.startsWith('..') || isAbsolute(relation)) {
    throw new Error('The Zetro worktree path is outside its configured root.')
  }
}

function assertNestedPath(root: string, candidate: string): void {
  const relation = relative(resolve(root), resolve(candidate))
  if (!relation || relation.startsWith('..') || isAbsolute(relation)) {
    throw new Error('The connected folder must stay inside the isolated worktree.')
  }
}

function decodeDataUrl(dataUrl: string): Buffer {
  const match = /^data:[^,]*?(;base64)?,([\s\S]*)$/.exec(dataUrl)
  if (!match) throw new Error('Zetro received an invalid file attachment.')
  return match[1]
    ? Buffer.from(match[2], 'base64')
    : Buffer.from(decodeURIComponent(match[2]), 'utf8')
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file'
}
