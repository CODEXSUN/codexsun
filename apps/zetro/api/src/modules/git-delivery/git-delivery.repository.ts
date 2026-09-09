import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type {
  GitDeliveryFlowRecord,
  GitDeliveryRegistry,
  GitDeliverySettings,
  ProjectGitDeliverySettings,
} from './git-delivery.types.js'

export const defaultGitDeliverySettings: GitDeliverySettings = {
  defaultChangelog: true,
  defaultDatabaseUpdate: 'auto',
  defaultPush: true,
  defaultSyncStrategy: 'rebase',
  defaultVersionBump: true,
  enabled: true,
}

export class GitDeliveryRepository {
  private registry: GitDeliveryRegistry = {
    flows: [],
    global: defaultGitDeliverySettings,
    projects: {},
  }

  public constructor(private readonly filePath: string) {}

  public async initialize(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    try {
      const stored = JSON.parse(
        await readFile(this.filePath, 'utf8'),
      ) as Partial<GitDeliveryRegistry>
      this.registry = {
        flows: stored.flows?.slice(0, 50) ?? [],
        global: { ...defaultGitDeliverySettings, ...stored.global },
        projects: stored.projects ?? {},
      }
    } catch (error) {
      if (!isMissingFile(error)) throw error
      await this.persist()
    }
  }

  public getGlobal(): GitDeliverySettings {
    return { ...this.registry.global }
  }

  public getProject(projectId: string): ProjectGitDeliverySettings {
    return this.registry.projects[projectId] ?? { ...this.registry.global, inheritGlobal: true }
  }

  public listFlows(projectId: string): GitDeliveryFlowRecord[] {
    return this.registry.flows.filter((flow) => flow.projectId === projectId).slice(0, 10)
  }

  public async saveFlow(flow: GitDeliveryFlowRecord): Promise<void> {
    this.registry.flows = [flow, ...this.registry.flows.filter(({ id }) => id !== flow.id)].slice(
      0,
      50,
    )
    await this.persist()
  }

  public async setGlobal(settings: GitDeliverySettings): Promise<void> {
    this.registry.global = settings
    await this.persist()
  }

  public async setProject(projectId: string, settings: ProjectGitDeliverySettings): Promise<void> {
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
