import { spawn } from 'node:child_process'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'

export interface CodexWorktree {
  path: string
  revision: string
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
    if (resolve(root) !== worktreePath) {
      throw new Error('The Zetro worktree path belongs to another repository checkout.')
    }

    return {
      path: worktreePath,
      revision: await runGit(worktreePath, ['rev-parse', 'HEAD']),
    }
  }
}

function samePath(left: string, right: string): boolean {
  return resolve(left).toLowerCase() === resolve(right).toLowerCase()
}

async function runGit(cwd: string, args: readonly string[]): Promise<string> {
  return new Promise((resolveCommand, reject) => {
    const child = spawn('git', ['-C', cwd, ...args], {
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
