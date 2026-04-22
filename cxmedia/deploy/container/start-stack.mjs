import { randomBytes } from "node:crypto"
import { spawn, spawnSync } from "node:child_process"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"

const garageConfigPath = "/etc/garage.toml"
const garageMetaPath = "/var/lib/garage/meta"
const garageDataPath = "/var/lib/garage/data"
const cxmediaDataPath = "/app/cxmedia/data"
const thumborPort = process.env.CXMEDIA_INTERNAL_THUMBOR_PORT || "4188"

let shuttingDown = false
const childProcesses = []

function ensureDirectory(targetPath) {
  if (!existsSync(targetPath)) {
    mkdirSync(targetPath, { recursive: true })
  }
}

function ensureEnvValue(key, createValue, isValid) {
  const current = process.env[key]

  if (isValid(current)) {
    return current
  }

  const nextValue = createValue()
  process.env[key] = nextValue
  return nextValue
}

function ensureGarageEnvironment() {
  ensureEnvValue("CXMEDIA_GARAGE_RPC_SECRET", () => randomBytes(32).toString("hex"), (value) =>
    /^[a-f0-9]{64}$/i.test(value || "")
  )
  ensureEnvValue("CXMEDIA_GARAGE_ADMIN_TOKEN", () => randomBytes(24).toString("base64url"), (value) =>
    (value?.length || 0) >= 24
  )
  ensureEnvValue("CXMEDIA_GARAGE_METRICS_TOKEN", () => randomBytes(24).toString("base64url"), (value) =>
    (value?.length || 0) >= 24
  )
  ensureEnvValue("CXMEDIA_S3_ACCESS_KEY_ID", () => `GK${randomBytes(12).toString("hex")}`, (value) =>
    /^GK[a-f0-9]{24}$/i.test(value || "")
  )
  ensureEnvValue("CXMEDIA_S3_SECRET_ACCESS_KEY", () => randomBytes(32).toString("hex"), (value) =>
    /^[a-f0-9]{64}$/i.test(value || "")
  )

  process.env.CXMEDIA_S3_ENDPOINT = "http://127.0.0.1:3900"
  process.env.CXMEDIA_S3_REGION = "garage"
  process.env.CXMEDIA_THUMBOR_INTERNAL_BASE_URL = `http://127.0.0.1:${thumborPort}`
  process.env.CXMEDIA_THUMBOR_SOURCE_BASE_URL =
    process.env.CXMEDIA_PUBLIC_BASE_URL || "http://127.0.0.1:4100"
  process.env.CXMEDIA_CDN_BASE_URL = process.env.CXMEDIA_PUBLIC_BASE_URL || "http://127.0.0.1:4100"
  process.env.GARAGE_RPC_SECRET = process.env.CXMEDIA_GARAGE_RPC_SECRET
  process.env.GARAGE_ADMIN_TOKEN = process.env.CXMEDIA_GARAGE_ADMIN_TOKEN
  process.env.GARAGE_METRICS_TOKEN = process.env.CXMEDIA_GARAGE_METRICS_TOKEN
}

function writeRuntimeEnvFile() {
  const lines = Object.entries(process.env)
    .filter(([key]) => key.startsWith("CXMEDIA_"))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value || ""}`)

  writeFileSync("/app/cxmedia/.env", `${lines.join("\n")}\n`, "utf8")
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    ...options,
  })

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim()
    throw new Error(output || `${command} ${args.join(" ")} failed.`)
  }

  return (result.stdout || "").trim()
}

function spawnManaged(command, args, options = {}) {
  const child = spawn(command, args, {
    env: process.env,
    stdio: "inherit",
    ...options,
  })
  childProcesses.push(child)
  child.on("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`${command} ${args.join(" ")} exited with code ${code}.`)
      shutdown(code || 1)
    }
  })
  return child
}

async function waitForGarageNodeId(timeoutMs) {
  const startedAt = Date.now()
  let lastError = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const output = runCommand("/garage", ["-c", garageConfigPath, "node", "id"])
      const match = /^([a-f0-9]+)@/im.exec(output)

      if (match?.[1]) {
        return match[1]
      }

      lastError = new Error("Garage node id command returned unexpected output.")
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw lastError || new Error("Timed out waiting for Garage node id.")
}

async function waitForGarageRpc(nodeId, timeoutMs) {
  const startedAt = Date.now()
  let lastError = null

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return runCommand("/garage", garageCommandArgs(nodeId, ["status"]))
    } catch (error) {
      lastError = error
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw lastError || new Error("Timed out waiting for Garage RPC.")
}

function garageCommandArgs(nodeId, extraArgs) {
  return [
    "-c",
    garageConfigPath,
    "-s",
    process.env.CXMEDIA_GARAGE_RPC_SECRET,
    "--rpc-host",
    `${nodeId}@127.0.0.1:3901`,
    ...extraArgs,
  ]
}

async function bootstrapGarage() {
  const nodeId = await waitForGarageNodeId(60_000)
  const accessKey = process.env.CXMEDIA_S3_ACCESS_KEY_ID
  const secretKey = process.env.CXMEDIA_S3_SECRET_ACCESS_KEY
  const bucket = process.env.CXMEDIA_S3_BUCKET

  if (!accessKey || !secretKey || !bucket) {
    throw new Error("Missing Garage bootstrap values.")
  }

  const statusOutput = await waitForGarageRpc(nodeId, 60_000)

  if (statusOutput.includes("NO ROLE ASSIGNED")) {
    const layoutOutput = runCommand("/garage", garageCommandArgs(nodeId, ["layout", "show"]))
    const versionMatch = /Current cluster layout version:\s+(\d+)/.exec(layoutOutput)
    const currentVersion = Number(versionMatch?.[1] || "0")

    runCommand("/garage", garageCommandArgs(nodeId, ["layout", "assign", "-z", "local", "-c", "10GB", nodeId]))
    runCommand("/garage", garageCommandArgs(nodeId, ["layout", "apply", "--version", String(currentVersion + 1)]))
  }

  try {
    runCommand("/garage", garageCommandArgs(nodeId, ["key", "info", accessKey]))
  } catch {
    runCommand("/garage", garageCommandArgs(nodeId, ["key", "import", "--yes", "-n", "cxmedia", accessKey, secretKey]))
  }

  try {
    runCommand("/garage", garageCommandArgs(nodeId, ["bucket", "info", bucket]))
  } catch {
    runCommand("/garage", garageCommandArgs(nodeId, ["bucket", "create", bucket]))
  }

  runCommand(
    "/garage",
    garageCommandArgs(nodeId, ["bucket", "allow", "--read", "--write", "--owner", bucket, "--key", accessKey])
  )
}

function shutdown(code = 0) {
  if (shuttingDown) {
    process.exit(code)
  }

  shuttingDown = true
  for (const child of childProcesses) {
    if (!child.killed) {
      child.kill("SIGTERM")
    }
  }

  setTimeout(() => {
    for (const child of childProcesses) {
      if (!child.killed) {
        child.kill("SIGKILL")
      }
    }
    process.exit(code)
  }, 5_000).unref()
}

async function main() {
  ensureDirectory(garageMetaPath)
  ensureDirectory(garageDataPath)
  ensureDirectory(cxmediaDataPath)
  ensureGarageEnvironment()
  writeRuntimeEnvFile()

  spawnManaged("/garage", ["server"])
  await bootstrapGarage()

  process.env.THUMBOR_PORT = thumborPort
  process.env.ALLOW_UNSAFE_URL = "True"
  process.env.AUTO_WEBP = "True"
  process.env.HTTP_LOADER_FORWARD_USER_AGENT = "True"
  process.env.QUALITY = "85"

  spawnManaged("/opt/thumbor/bin/thumbor", [
    "-p",
    thumborPort,
    "-i",
    "127.0.0.1",
    "--use-environment",
    "True",
  ])

  const nodeProcess = spawnManaged("node", ["build/cxmedia/server.js"], {
    cwd: "/app",
  })

  process.on("SIGINT", () => shutdown(0))
  process.on("SIGTERM", () => shutdown(0))
  nodeProcess.on("exit", (code) => shutdown(code || 0))
}

void main().catch((error) => {
  console.error(error)
  shutdown(1)
})
