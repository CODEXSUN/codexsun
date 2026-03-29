import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

export type EnvMap = Record<string, string | undefined>

export function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    return {}
  }

  const file = readFileSync(filePath, "utf8")
  const entries = file.split(/\r?\n/)
  const values: Record<string, string> = {}

  for (const rawLine of entries) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    const separatorIndex = line.indexOf("=")

    if (separatorIndex <= 0) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "")

    values[key] = value
  }

  return values
}

export function resolveEnv(cwd = process.cwd()): EnvMap {
  const envPath = path.resolve(cwd, ".env")
  const fileEnv = parseEnvFile(envPath)

  return {
    ...fileEnv,
    ...process.env,
  }
}

export function readBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) {
    return fallback
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

export function readNumber(
  value: string | undefined,
  fallback: number,
  label: string
) {
  if (value === undefined || value === "") {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${label} value: ${value}`)
  }

  return parsed
}
