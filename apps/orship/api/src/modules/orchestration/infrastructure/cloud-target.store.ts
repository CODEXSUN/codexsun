import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { cloudTargetUpdateSchema, type CloudTargetUpdate } from '@codexsun/orship-contracts'

export class CloudTargetStore {
  private readonly filePath: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
    this.filePath = resolve(projectRoot, 'storage/app/private/orship/cloud-target.json')
  }

  private readonly projectRoot: string

  async load(): Promise<CloudTargetUpdate | undefined> {
    try {
      return cloudTargetUpdateSchema.parse(
        normalizeTarget(JSON.parse(await readFile(this.filePath, 'utf8')), this.projectRoot),
      )
    } catch (error) {
      if (isMissingFile(error)) return undefined
      throw error
    }
  }

  async save(target: CloudTargetUpdate): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    const temporaryPath = `${this.filePath}.next`
    await writeFile(temporaryPath, `${JSON.stringify(target, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, this.filePath)
  }
}

function normalizeTarget(input: unknown, projectRoot: string): unknown {
  if (!input || typeof input !== 'object' || !('repository' in input) || !('vps' in input))
    return input
  const target = input as { repository: unknown; vps: unknown } & Partial<CloudTargetUpdate>
  return {
    localWorkspacePath: target.localWorkspacePath ?? projectRoot,
    name: target.name ?? 'Local Docker',
    repository: target.repository,
    targetType: target.targetType ?? 'local-docker',
    vps: target.vps,
  }
}

function isMissingFile(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
}
