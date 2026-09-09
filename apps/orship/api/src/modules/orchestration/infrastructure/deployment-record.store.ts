import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { deploymentRecordSchema, type DeploymentRecord } from '@codexsun/orship-contracts'

export class DeploymentRecordStore {
  private readonly directory: string

  constructor(projectRoot: string) {
    this.directory = resolve(projectRoot, 'storage/app/private/orship/deployments/platform')
  }

  async list(): Promise<readonly DeploymentRecord[]> {
    try {
      const content = await readFile(join(this.directory, 'records.jsonl'), 'utf8')
      return content
        .split('\n')
        .filter(Boolean)
        .map((line) => deploymentRecordSchema.parse(JSON.parse(line)))
    } catch (error) {
      if (isMissingFile(error)) return []
      throw error
    }
  }

  async append(record: DeploymentRecord): Promise<void> {
    await mkdir(this.directory, { recursive: true })
    await appendFile(
      join(this.directory, 'records.jsonl'),
      `${JSON.stringify(deploymentRecordSchema.parse(record))}\n`,
      'utf8',
    )
  }
}

function isMissingFile(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
}
