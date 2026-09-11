import { readFile, rename, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PrerequisiteSource, PrerequisiteSourceFile } from '@codexsun/orship-contracts'

const sourceFiles: Record<PrerequisiteSourceFile, string> = {
  compose: 'compose.yaml',
  dockerfile: 'Dockerfile',
  'filebrowser-init': 'filebrowser-init.sh',
}

export class PrerequisiteSourceStore {
  constructor(private readonly projectRoot: string) {}

  async get(file: PrerequisiteSourceFile): Promise<PrerequisiteSource> {
    const path = this.resolve(file)
    const [content, details] = await Promise.all([readFile(path, 'utf8'), stat(path)])
    return { content, file, updatedAt: details.mtime.toISOString() }
  }

  async update(file: PrerequisiteSourceFile, content: string): Promise<PrerequisiteSource> {
    const path = this.resolve(file)
    const temporaryPath = `${path}.orship-next`
    await writeFile(temporaryPath, content.replace(/\r\n/g, '\n'), 'utf8')
    await rename(temporaryPath, path)
    return this.get(file)
  }

  private resolve(file: PrerequisiteSourceFile): string {
    return join(this.projectRoot, '.container', 'prerequisites', sourceFiles[file])
  }
}
