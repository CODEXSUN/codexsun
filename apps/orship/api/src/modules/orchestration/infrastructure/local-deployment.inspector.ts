import { stat } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import type { DeploymentEvidence } from '@codexsun/orship-contracts'

const execFileAsync = promisify(execFile)

export class LocalDeploymentInspector {
  constructor(private readonly projectRoot: string) {}

  async inspect(serviceIds: readonly string[]): Promise<DeploymentEvidence> {
    const repository = await this.inspectRepository()
    const commands = await Promise.all(
      deploymentCommands.map((command) => this.inspectCommand(command)),
    )
    return {
      applicationId: 'platform',
      commands,
      profile: 'platform-only',
      repository,
      serviceIds: [...serviceIds],
      targetId: 'local-docker',
      targetType: 'local-docker',
    }
  }

  private async inspectRepository(): Promise<DeploymentEvidence['repository']> {
    const [branch, commit, status, url] = await Promise.all([
      this.runGit(['branch', '--show-current']),
      this.runGit(['rev-parse', '--short=12', 'HEAD']),
      this.runGit(['status', '--porcelain']),
      this.runGit(['config', '--get', 'remote.origin.url']),
    ])
    return {
      branch: branch || 'detached',
      commit: commit || 'unknown',
      dirty: Boolean(status),
      path: this.projectRoot,
      url: url ? redactRepositoryUrl(url) : null,
    }
  }

  private async inspectCommand(command: LocalDeploymentCommand) {
    return {
      action: command.action,
      command: command.command,
      expectedFiles: await Promise.all(
        command.expectedFiles.map((file) => this.inspectFile(file, 'generated')),
      ),
      requiredFiles: await Promise.all(
        command.requiredFiles.map((file) => this.inspectFile(file, 'source')),
      ),
      title: command.title,
    }
  }

  private async inspectFile(path: string, kind: 'source' | 'generated') {
    try {
      const file = await stat(resolve(this.projectRoot, path))
      return { exists: file.isFile(), kind, modifiedAt: file.mtime.toISOString(), path }
    } catch (error) {
      if (isMissingFile(error)) return { exists: false, kind, modifiedAt: null, path }
      throw error
    }
  }

  private async runGit(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync('git', args, {
        cwd: this.projectRoot,
        maxBuffer: 32_768,
        timeout: 3_000,
        windowsHide: true,
      })
      return stdout.trim()
    } catch {
      return ''
    }
  }
}

type LocalDeploymentCommand = {
  action: 'verify' | 'pull' | 'prepare' | 'deploy'
  command: string
  expectedFiles: readonly string[]
  requiredFiles: readonly string[]
  title: string
}

const deploymentCommands: readonly LocalDeploymentCommand[] = [
  {
    action: 'verify',
    command: 'npm.cmd run runtime:validate',
    expectedFiles: [],
    requiredFiles: ['.container/catalog.json', '.container/profiles/platform-only.json'],
    title: 'Validate the Platform-only profile.',
  },
  {
    action: 'pull',
    command: 'git pull --ff-only',
    expectedFiles: [],
    requiredFiles: ['.git/HEAD', '.container/catalog.json'],
    title: 'Pull the reviewed source without a merge commit.',
  },
  {
    action: 'prepare',
    command: 'npm.cmd run runtime:compose -- platform-only',
    expectedFiles: ['dist/deployments/platform-only/compose.yaml'],
    requiredFiles: ['.container/catalog.json', '.container/profiles/platform-only.json'],
    title: 'Generate the Platform-only Docker Compose assembly.',
  },
  {
    action: 'deploy',
    command: 'docker compose -f dist/deployments/platform-only/compose.yaml up --build',
    expectedFiles: ['dist/deployments/platform-only/environment.env'],
    requiredFiles: ['dist/deployments/platform-only/compose.yaml'],
    title: 'Start the generated Platform-only Docker assembly.',
  },
]

function isMissingFile(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
}

function redactRepositoryUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.username || parsed.password) {
      parsed.username = ''
      parsed.password = ''
    }
    return parsed.toString().replace(/\/$/u, '')
  } catch {
    return url.replace(/^[^@\s/:]+@/u, '')
  }
}
