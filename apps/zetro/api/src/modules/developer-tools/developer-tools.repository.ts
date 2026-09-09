import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type {
  DeveloperToolRegistry,
  DeveloperToolSettings,
  ProjectToolSettings,
} from './developer-tools.types.js'

export const defaultToolSettings: DeveloperToolSettings = {
  allowForceWithLease: false,
  allowPush: true,
  autoRefreshSeconds: 15,
  branchPrefix: 'codex/',
  commitInstructions: '',
  compareBranch: 'main',
  editor: 'auto',
}

export class DeveloperToolsRepository {
  private registry: DeveloperToolRegistry = { global: defaultToolSettings, projects: {} }

  public constructor(private readonly filePath: string) {}

  public async initialize(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    try {
      const stored = JSON.parse(
        await readFile(this.filePath, 'utf8'),
      ) as Partial<DeveloperToolRegistry>
      this.registry = {
        global: { ...defaultToolSettings, ...stored.global },
        projects: stored.projects ?? {},
      }
    } catch (error) {
      if (!isMissingFile(error)) throw error
      await this.persist()
    }
  }

  public getGlobal(): DeveloperToolSettings {
    return { ...this.registry.global }
  }

  public getProject(projectId: string): ProjectToolSettings {
    return this.registry.projects[projectId] ?? { ...this.registry.global, inheritGlobal: true }
  }

  public async setGlobal(settings: DeveloperToolSettings): Promise<void> {
    this.registry.global = settings
    await this.persist()
  }

  public async setProject(projectId: string, settings: ProjectToolSettings): Promise<void> {
    this.registry.projects[projectId] = settings
    await this.persist()
  }

  private async persist(): Promise<void> {
    const temporaryPath = `${this.filePath}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(this.registry, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, this.filePath)
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
