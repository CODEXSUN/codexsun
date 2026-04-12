import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import {
  parseEnvFile,
  readNumber,
  type EnvMap,
} from "../../../framework/src/runtime/config/env.js"

export type FrappeEnvConfig = {
  enabled: boolean
  baseUrl: string
  siteName: string
  apiKey: string
  apiSecret: string
  timeoutSeconds: number
  defaultCompany: string
  defaultWarehouse: string
  configFingerprint: string
}

export const frappeEnvKeys = [
  "FRAPPE_ENABLED",
  "FRAPPE_BASE_URL",
  "FRAPPE_SITE_NAME",
  "FRAPPE_API_KEY",
  "FRAPPE_API_SECRET",
  "FRAPPE_TIMEOUT_SECONDS",
  "FRAPPE_DEFAULT_COMPANY",
  "FRAPPE_DEFAULT_WAREHOUSE",
] as const

type FrappeEnvKey = (typeof frappeEnvKeys)[number]
type FrappeEnvWritableInput = Omit<FrappeEnvConfig, "configFingerprint">

function readRequiredValue(
  env: EnvMap,
  key: string,
  options?: { allowEmpty?: boolean }
) {
  const rawValue = env[key]

  if (rawValue === undefined) {
    throw new Error(`Missing required Frappe env variable: ${key}`)
  }

  const value = rawValue.trim()

  if (!options?.allowEmpty && value.length === 0) {
    throw new Error(`Frappe env variable ${key} must not be empty.`)
  }

  return value
}

function readRequiredBoolean(env: EnvMap, key: string) {
  const value = readRequiredValue(env, key).toLowerCase()

  if (value === "true" || value === "1" || value === "yes" || value === "on") {
    return true
  }

  if (value === "false" || value === "0" || value === "no" || value === "off") {
    return false
  }

  throw new Error(`Invalid boolean Frappe env variable ${key}: ${value}`)
}

function normalizeBaseUrl(value: string) {
  const normalizedValue = value.trim().replace(/\/+$/, "")

  let parsedUrl: URL

  try {
    parsedUrl = new URL(normalizedValue)
  } catch {
    throw new Error("FRAPPE_BASE_URL must be a valid HTTP or HTTPS URL.")
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("FRAPPE_BASE_URL must use HTTP or HTTPS.")
  }

  return normalizedValue
}

function createConfigFingerprint(input: Omit<FrappeEnvConfig, "configFingerprint">) {
  return createHash("sha256")
    .update(
      [
        input.enabled ? "true" : "false",
        input.baseUrl,
        input.siteName,
        input.apiKey,
        input.apiSecret,
        String(input.timeoutSeconds),
        input.defaultCompany,
        input.defaultWarehouse,
      ].join("|"),
      "utf8"
    )
    .digest("hex")
}

export function parseFrappeEnv(env: EnvMap): FrappeEnvConfig {
  const configWithoutFingerprint = {
    enabled: readRequiredBoolean(env, "FRAPPE_ENABLED"),
    baseUrl: normalizeBaseUrl(readRequiredValue(env, "FRAPPE_BASE_URL")),
    siteName: readRequiredValue(env, "FRAPPE_SITE_NAME"),
    apiKey: readRequiredValue(env, "FRAPPE_API_KEY"),
    apiSecret: readRequiredValue(env, "FRAPPE_API_SECRET"),
    timeoutSeconds: readNumber(
      readRequiredValue(env, "FRAPPE_TIMEOUT_SECONDS"),
      0,
      "FRAPPE_TIMEOUT_SECONDS"
    ),
    defaultCompany: readRequiredValue(env, "FRAPPE_DEFAULT_COMPANY", {
      allowEmpty: true,
    }),
    defaultWarehouse: readRequiredValue(env, "FRAPPE_DEFAULT_WAREHOUSE"),
  }

  if (configWithoutFingerprint.timeoutSeconds < 1) {
    throw new Error("FRAPPE_TIMEOUT_SECONDS must be greater than zero.")
  }

  return {
    ...configWithoutFingerprint,
    configFingerprint: createConfigFingerprint(configWithoutFingerprint),
  }
}

export function readFrappeEnvConfig(cwd = process.cwd()) {
  return parseFrappeEnv(parseEnvFile(path.resolve(cwd, ".env")))
}

function escapeEnvValue(value: string) {
  if (value.length === 0) {
    return "\"\""
  }

  if (/^[A-Za-z0-9_./:@,-]+$/.test(value)) {
    return value
  }

  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

function toFrappeEnvValueMap(input: FrappeEnvWritableInput): Record<FrappeEnvKey, string> {
  return {
    FRAPPE_ENABLED: input.enabled ? "true" : "false",
    FRAPPE_BASE_URL: input.baseUrl,
    FRAPPE_SITE_NAME: input.siteName,
    FRAPPE_API_KEY: input.apiKey,
    FRAPPE_API_SECRET: input.apiSecret,
    FRAPPE_TIMEOUT_SECONDS: String(input.timeoutSeconds),
    FRAPPE_DEFAULT_COMPANY: input.defaultCompany,
    FRAPPE_DEFAULT_WAREHOUSE: input.defaultWarehouse,
  }
}

function serializeManagedEnvBlock(values: Record<FrappeEnvKey, string>) {
  return frappeEnvKeys.map((key) => `${key}=${escapeEnvValue(values[key])}`)
}

function updateManagedFrappeEnvBlock(
  existingFileContents: string,
  values: Record<FrappeEnvKey, string>
) {
  const lines = existingFileContents.length > 0 ? existingFileContents.split(/\r?\n/) : []
  const nextLines = lines.filter((line) => {
    const trimmedLine = line.trim()

    if (
      trimmedLine === "# Frappe" ||
      trimmedLine === "# Frappe ERPNext connector contract."
    ) {
      return false
    }

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return true
    }

    const separatorIndex = line.indexOf("=")

    if (separatorIndex <= 0) {
      return true
    }

    const key = line.slice(0, separatorIndex).trim() as FrappeEnvKey

    if (!frappeEnvKeys.includes(key)) {
      return true
    }

    return false
  })
  const managedLines = serializeManagedEnvBlock(values)

  if (nextLines.length > 0 && nextLines[nextLines.length - 1]?.trim()) {
    nextLines.push("")
  }

  nextLines.push("# Frappe")
  nextLines.push("# Frappe ERPNext connector contract.")
  nextLines.push(...managedLines)

  return `${nextLines.join("\n").replace(/\n+$/, "\n")}`
}

export function writeFrappeEnvConfig(input: FrappeEnvWritableInput, cwd = process.cwd()) {
  const nextConfig = parseFrappeEnv(toFrappeEnvValueMap(input))
  const envPath = path.resolve(cwd, ".env")
  const existingFileContents = existsSync(envPath)
    ? readFileSync(envPath, "utf8")
    : ""

  writeFileSync(
    envPath,
    updateManagedFrappeEnvBlock(
      existingFileContents,
      toFrappeEnvValueMap(nextConfig)
    ),
    "utf8"
  )

  return nextConfig
}
