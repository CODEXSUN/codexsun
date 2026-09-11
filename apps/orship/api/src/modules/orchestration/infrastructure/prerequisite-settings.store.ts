import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PrerequisiteSettings, PrerequisiteSettingsUpdate } from '@codexsun/orship-contracts'

const defaults = {
  fileBrowserAdminUser: 'admin',
  mariadbPort: 3307,
  redisPort: 6379,
  storagePort: 7090,
}

export class PrerequisiteSettingsStore {
  constructor(private readonly projectRoot: string) {}

  async get(): Promise<PrerequisiteSettings> {
    const values = await this.readValues()
    return {
      fileBrowserAdminConfigured: hasValue(values.PREREQUISITE_FILEBROWSER_ADMIN_PASSWORD),
      fileBrowserAdminUser:
        values.PREREQUISITE_FILEBROWSER_ADMIN_USER || defaults.fileBrowserAdminUser,
      mariadbPort: readPort(values.PREREQUISITE_MARIADB_PORT, defaults.mariadbPort),
      mariadbRootPasswordConfigured: hasValue(values.PREREQUISITE_MARIADB_ROOT_PASSWORD),
      redisPasswordConfigured: hasValue(values.PREREQUISITE_REDIS_PASSWORD),
      redisPort: readPort(values.PREREQUISITE_REDIS_PORT, defaults.redisPort),
      storagePort: readPort(values.PREREQUISITE_FILEBROWSER_PORT, defaults.storagePort),
    }
  }

  async update(input: PrerequisiteSettingsUpdate): Promise<PrerequisiteSettings> {
    const path = join(this.projectRoot, '.env')
    const source = await readFile(path, 'utf8').catch(() => '')
    const values: Record<string, string | undefined> = {
      PREREQUISITE_FILEBROWSER_ADMIN_USER: input.fileBrowserAdminUser,
      PREREQUISITE_FILEBROWSER_PORT: String(input.storagePort),
      PREREQUISITE_MARIADB_PORT: String(input.mariadbPort),
      PREREQUISITE_REDIS_PORT: String(input.redisPort),
    }
    if (input.fileBrowserAdminPassword) {
      values.PREREQUISITE_FILEBROWSER_ADMIN_PASSWORD = input.fileBrowserAdminPassword
    }
    if (input.mariadbRootPassword) {
      values.PREREQUISITE_MARIADB_ROOT_PASSWORD = input.mariadbRootPassword
    }
    if (input.redisPassword) values.PREREQUISITE_REDIS_PASSWORD = input.redisPassword
    await writeFile(path, updateEnv(source, values), 'utf8')
    return this.get()
  }

  private async readValues(): Promise<Record<string, string>> {
    const source = await readFile(join(this.projectRoot, '.env'), 'utf8').catch(() => '')
    return Object.fromEntries(
      source
        .split(/\r?\n/u)
        .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/u))
        .filter((match): match is RegExpMatchArray => Boolean(match))
        .map((match) => [match[1], match[2]]),
    )
  }
}

function hasValue(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

function readPort(value: string | undefined, fallback: number): number {
  const port = Number(value)
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : fallback
}

function updateEnv(source: string, values: Record<string, string | undefined>): string {
  const pending = new Map(Object.entries(values).filter(([, value]) => value !== undefined))
  const lines = source.split(/\r?\n/u).map((line) => {
    const key = line.match(/^([A-Z0-9_]+)=/u)?.[1]
    if (!key || !pending.has(key)) return line
    const value = pending.get(key)
    pending.delete(key)
    return `${key}=${value}`
  })
  if (pending.size) {
    if (lines.at(-1) !== '') lines.push('')
    lines.push('# === Shared prerequisites ===')
    for (const [key, value] of pending) lines.push(`${key}=${value}`)
  }
  return `${lines.join('\n').replace(/\n+$/u, '')}\n`
}
