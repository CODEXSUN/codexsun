import { parse } from 'dotenv'
import { readFileSync } from 'node:fs'

export interface PlatformEnvironmentLoadOptions {
  aliases?: Readonly<Record<string, readonly string[]>>
  defaults?: Readonly<Record<string, string>>
  path: string
  source?: NodeJS.ProcessEnv
}

export class PlatformEnvironmentLoader {
  static load(options: PlatformEnvironmentLoadOptions): Readonly<NodeJS.ProcessEnv> {
    const source = options.source ?? process.env
    const values: NodeJS.ProcessEnv = {
      ...options.defaults,
      ...readEnvironmentFile(options.path),
      ...source,
    }

    applyAliases(values, options.aliases ?? {})
    publishMissingValues(source, values)
    return Object.freeze({ ...values })
  }
}

function readEnvironmentFile(path: string): NodeJS.ProcessEnv {
  try {
    return parse(readFileSync(path))
  } catch (error) {
    if (isMissingFile(error)) return {}
    throw error
  }
}

function applyAliases(
  values: NodeJS.ProcessEnv,
  aliases: Readonly<Record<string, readonly string[]>>,
): void {
  for (const [name, fallbackNames] of Object.entries(aliases)) {
    if (values[name] !== undefined) continue
    const fallback = fallbackNames.map((key) => values[key]).find((value) => value !== undefined)
    if (fallback !== undefined) values[name] = fallback
  }
}

function publishMissingValues(target: NodeJS.ProcessEnv, values: NodeJS.ProcessEnv): void {
  for (const [name, value] of Object.entries(values)) {
    if (target[name] === undefined && value !== undefined) target[name] = value
  }
}

function isMissingFile(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
}
