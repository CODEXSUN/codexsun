import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"

type EnvRule = {
  key: string
  createValue: () => string
  isValid: (value: string | undefined) => boolean
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const cxmediaRoot = path.join(repositoryRoot, "cxmedia")
const envFilePath = path.join(cxmediaRoot, ".env")
const envExamplePath = path.join(cxmediaRoot, ".env.example")
const composeFilePath = path.join(cxmediaRoot, "deploy", "docker-compose.yml")

function parseEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {
      values: new Map<string, string>(),
    }
  }

  const values = new Map<string, string>()

  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    const separatorIndex = line.indexOf("=")

    if (separatorIndex <= 0) {
      continue
    }

    values.set(line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim())
  }

  return { values }
}

function upsertEnvValues(filePath: string, rules: EnvRule[]) {
  const existing = existsSync(filePath)
  const example = existsSync(envExamplePath) ? readFileSync(envExamplePath, "utf8").trimEnd() : ""
  let content = existing ? readFileSync(filePath, "utf8") : example
  const { values } = parseEnvFile(filePath)
  const changedKeys: string[] = []

  if (content && !content.endsWith("\n")) {
    content += "\n"
  }

  for (const rule of rules) {
    const currentValue = values.get(rule.key)

    if (rule.isValid(currentValue)) {
      continue
    }

    const nextValue = rule.createValue()
    const pattern = new RegExp(`^${rule.key}=.*$`, "m")

    if (pattern.test(content)) {
      content = content.replace(pattern, `${rule.key}=${nextValue}`)
    } else {
      content += `${rule.key}=${nextValue}\n`
    }

    changedKeys.push(rule.key)
  }

  if (changedKeys.length > 0 || !existing) {
    writeFileSync(filePath, content, "utf8")
  }

  return changedKeys
}

function ensureCxmediaEnv() {
  const changedKeys = upsertEnvValues(envFilePath, [
    {
      key: "CXMEDIA_JWT_SECRET",
      createValue: () => randomBytes(24).toString("base64url"),
      isValid: (value) =>
        Boolean(value && value !== "change-this-secret-value" && value.length >= 16),
    },
    {
      key: "CXMEDIA_SIGNED_URL_SECRET",
      createValue: () => randomBytes(24).toString("base64url"),
      isValid: (value) =>
        Boolean(value && value !== "change-this-signed-secret" && value.length >= 16),
    },
    {
      key: "CXMEDIA_SYNC_SECRET",
      createValue: () => randomBytes(24).toString("base64url"),
      isValid: (value) =>
        Boolean(value && value !== "change-this-sync-secret" && value.length >= 16),
    },
    {
      key: "CXMEDIA_HANDOFF_SECRET",
      createValue: () => randomBytes(24).toString("base64url"),
      isValid: (value) =>
        Boolean(value && value !== "change-this-handoff-secret" && value.length >= 16),
    },
    {
      key: "CXMEDIA_GARAGE_RPC_SECRET",
      createValue: () => randomBytes(32).toString("hex"),
      isValid: (value) => /^[a-f0-9]{64}$/i.test(value ?? ""),
    },
    {
      key: "CXMEDIA_GARAGE_ADMIN_TOKEN",
      createValue: () => randomBytes(24).toString("base64url"),
      isValid: (value) => (value?.length ?? 0) >= 24,
    },
    {
      key: "CXMEDIA_GARAGE_METRICS_TOKEN",
      createValue: () => randomBytes(24).toString("base64url"),
      isValid: (value) => (value?.length ?? 0) >= 24,
    },
    {
      key: "CXMEDIA_S3_ACCESS_KEY_ID",
      createValue: () => `GK${randomBytes(12).toString("hex")}`,
      isValid: (value) => /^GK[a-f0-9]{24}$/i.test(value ?? ""),
    },
    {
      key: "CXMEDIA_S3_SECRET_ACCESS_KEY",
      createValue: () => randomBytes(32).toString("hex"),
      isValid: (value) => /^[a-f0-9]{64}$/i.test(value ?? ""),
    },
    {
      key: "CXMEDIA_CORS_ORIGINS",
      createValue: () => "http://localhost:4100",
      isValid: (value) => Boolean(value?.trim()),
    },
  ])

  const { values } = parseEnvFile(envFilePath)
  const requiredKeys = [
    "CXMEDIA_S3_BUCKET",
    "CXMEDIA_ADMIN_EMAIL",
    "CXMEDIA_ADMIN_PASSWORD",
    "CXMEDIA_JWT_SECRET",
    "CXMEDIA_SIGNED_URL_SECRET",
  ]
  const missingKeys = requiredKeys.filter((key) => !values.get(key))

  if (missingKeys.length > 0) {
    throw new Error(`Missing required cxmedia env values in ${envFilePath}: ${missingKeys.join(", ")}`)
  }

  return changedKeys
}

function dockerCompose(args: string[]) {
  const { values } = parseEnvFile(envFilePath)
  const env = { ...process.env }

  for (const [key, value] of values.entries()) {
    env[key] = value
  }

  execFileSync("docker", ["compose", "-f", composeFilePath, ...args], {
    cwd: repositoryRoot,
    env,
    stdio: "inherit",
  })
}

async function waitForHttp(url: string, label: string, timeoutMs: number) {
  const startedAt = Date.now()
  let lastError: Error | null = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)

      if (response.ok) {
        return
      }

      lastError = new Error(`${label} returned ${response.status}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(`Failed to reach ${label}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw lastError ?? new Error(`Timed out waiting for ${label}`)
}

async function bringUpStack() {
  const changedKeys = ensureCxmediaEnv()

  if (changedKeys.length > 0) {
    console.info(`Seeded cxmedia env values: ${changedKeys.join(", ")}`)
  }

  dockerCompose(["up", "-d", "--build"])
  await waitForHttp("http://127.0.0.1:4100/health", "cxmedia health", 120_000)
  dockerCompose(["ps"])
  console.info("cxmedia app is ready at http://127.0.0.1:4100")
}

function bringDownStack() {
  dockerCompose(["down"])
}

async function main() {
  const command = process.argv[2] ?? "up"

  if (command === "up") {
    await bringUpStack()
    return
  }

  if (command === "down") {
    bringDownStack()
    return
  }

  throw new Error(`Unsupported cxmedia docker command: ${command}`)
}

void main()
