import { execFile } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { promisify } from "node:util"

import {
  hostedAppsSoftwareUpdateResponseSchema,
  hostedAppsStatusResponseSchema,
  type HostedAppSoftwareUpdateMode,
  type HostedAppStatusItem,
  type HostedAppsSoftwareUpdateResponse,
  type HostedAppsStatusResponse,
} from "../../../shared/hosted-apps.js"
import type { SystemUpdateStatus } from "../../../shared/system-update.js"
import type { ServerConfig } from "../config/server-config.js"
import { resolveRuntimeSettingsRoot } from "../config/runtime-settings-service.js"
import { ApplicationError } from "../errors/application-error.js"
import { runDeveloperOperation } from "./developer-operations-service.js"
import { getSystemUpdateStatus, runSystemUpdate } from "../system-update/system-update-service.js"

const execFileAsync = promisify(execFile)

type CommandResult = {
  ok: boolean
  stdout: string
  stderr: string
}

type HostedAppsCommandRunner = (
  command: string,
  args: string[],
  cwd: string,
  allowFailure?: boolean
) => Promise<CommandResult>

type HostedAppsFetch = (input: string, init?: RequestInit) => Promise<Response>

type HostedClientConfig = {
  clientId: string
  displayName: string
  containerName: string
  localDomain: string | null
  cloudDomain: string | null
  configuredPublicPort: number | null
}

type DockerInspectResult = {
  running: boolean
  startedAt: string | null
  image: string | null
  hostPort: number | null
  missing: boolean
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
  allowFailure = false
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd,
      encoding: "utf8",
    })

    return {
      ok: true,
      stdout,
      stderr,
    }
  } catch (error) {
    const execError = error as {
      stdout?: string
      stderr?: string
      message: string
    }

    if (!allowFailure) {
      throw new Error(execError.stderr?.trim() || execError.message)
    }

    return {
      ok: false,
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? execError.message,
    }
  }
}

function parseClientConfig(raw: string, fallbackClientId: string): HostedClientConfig {
  const values = new Map<string, string>()

  for (const line of raw.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue
    }

    const match = trimmedLine.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|'([^']*)')$/)

    if (!match) {
      continue
    }

    values.set(match[1]!, (match[2] ?? match[3] ?? "").trim())
  }

  const configuredPort = values.get("CLIENT_APP_HTTP_HOST_PORT_CLOUD")
    ?? values.get("CLIENT_APP_HTTP_HOST_PORT_LOCAL")
    ?? values.get("CLIENT_PUBLIC_PORT_LOCAL")
    ?? values.get("CLIENT_PUBLIC_PORT_CLOUD")
    ?? null
  const parsedPort = configuredPort ? Number.parseInt(configuredPort, 10) : Number.NaN

  return {
    clientId: values.get("CLIENT_ID") || fallbackClientId,
    displayName: values.get("CLIENT_DISPLAY_NAME") || fallbackClientId,
    containerName:
      values.get("CLIENT_CONTAINER") || `${fallbackClientId.replace(/_/g, "-")}-app`,
    localDomain: values.get("CLIENT_DOMAIN_LOCAL") || null,
    cloudDomain: values.get("CLIENT_DOMAIN_CLOUD") || null,
    configuredPublicPort: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : null,
  }
}

function readHostedClientConfigs(rootPath: string) {
  const clientsRoot = path.join(rootPath, ".container", "clients")

  if (!existsSync(clientsRoot)) {
    return []
  }

  return readdirSync(clientsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const configPath = path.join(clientsRoot, entry.name, "client.conf.sh")

      if (!existsSync(configPath)) {
        return null
      }

      return parseClientConfig(readFileSync(configPath, "utf8"), entry.name)
    })
    .filter((entry): entry is HostedClientConfig => entry != null)
    .sort((left, right) => left.displayName.localeCompare(right.displayName))
}

async function getDockerInspect(
  rootPath: string,
  containerName: string,
  commandRunner: HostedAppsCommandRunner
): Promise<DockerInspectResult> {
  const result = await commandRunner("docker", ["inspect", containerName], rootPath, true)

  if (!result.ok) {
    const normalizedError = result.stderr.toLowerCase()

    if (normalizedError.includes("no such object") || normalizedError.includes("no such container")) {
      return {
        running: false,
        startedAt: null,
        image: null,
        hostPort: null,
        missing: true,
      }
    }

    return {
      running: false,
      startedAt: null,
      image: null,
      hostPort: null,
      missing: false,
    }
  }

  const payload = JSON.parse(result.stdout) as Array<Record<string, unknown>>
  const [inspect] = payload
  const state =
    inspect?.State && typeof inspect.State === "object"
      ? (inspect.State as Record<string, unknown>)
      : {}
  const config =
    inspect?.Config && typeof inspect.Config === "object"
      ? (inspect.Config as Record<string, unknown>)
      : {}
  const hostConfig =
    inspect?.HostConfig && typeof inspect.HostConfig === "object"
      ? (inspect.HostConfig as Record<string, unknown>)
      : {}
  const portBindings =
    hostConfig.PortBindings && typeof hostConfig.PortBindings === "object"
      ? (hostConfig.PortBindings as Record<string, unknown>)
      : {}
  const portEntry = Array.isArray(portBindings["4000/tcp"])
    ? (portBindings["4000/tcp"] as Array<Record<string, unknown>>)[0]
    : null
  const hostPortRaw =
    portEntry && typeof portEntry === "object" ? portEntry.HostPort : null
  const parsedHostPort =
    typeof hostPortRaw === "string" ? Number.parseInt(hostPortRaw, 10) : Number.NaN

  return {
    running: state.Running === true,
    startedAt:
      typeof state.StartedAt === "string" && state.StartedAt.trim()
        ? state.StartedAt.trim()
        : null,
    image:
      typeof config.Image === "string" && config.Image.trim()
        ? config.Image.trim()
        : null,
    hostPort:
      Number.isFinite(parsedHostPort) && parsedHostPort > 0 ? parsedHostPort : null,
    missing: false,
  }
}

function summarizeHostedApps(items: HostedAppStatusItem[]) {
  return {
    total: items.length,
    running: items.filter((item) => item.running).length,
    live: items.filter((item) => item.healthState === "live").length,
    starting: items.filter((item) => item.healthState === "starting").length,
    failed: items.filter((item) => item.healthState === "failed").length,
    down: items.filter((item) => item.healthState === "down").length,
    missing: items.filter((item) => item.dockerState === "missing").length,
  }
}

async function readHealthState(
  hostPort: number,
  publicScheme: "http" | "https",
  fetcher: HostedAppsFetch
) {
  try {
    const response = await fetcher(`http://127.0.0.1:${hostPort}/health`, {
      cache: "no-store",
      headers:
        publicScheme === "https" ? { "x-forwarded-proto": "https" } : undefined,
    })
    const payload = (await response.json().catch(() => null)) as
      | { status?: string; detail?: string | null }
      | null

    if (response.ok) {
      return {
        healthState: "live" as const,
        healthMessage: "Health check returned OK.",
        reachable: true,
      }
    }

    if (payload?.status === "starting_up") {
      return {
        healthState: "starting" as const,
        healthMessage: payload.detail?.trim() || "Container is still starting.",
        reachable: true,
      }
    }

    if (payload?.status === "startup_failed") {
      return {
        healthState: "failed" as const,
        healthMessage: payload.detail?.trim() || "Container startup failed.",
        reachable: true,
      }
    }

    return {
      healthState: "down" as const,
      healthMessage: `Health check returned HTTP ${response.status}.`,
      reachable: false,
    }
  } catch (error) {
    return {
      healthState: "down" as const,
      healthMessage:
        error instanceof Error ? error.message : "Health check could not be completed.",
      reachable: false,
    }
  }
}

async function resolveSoftwareUpdateMode(
  config: ServerConfig,
  commandRunner: HostedAppsCommandRunner
): Promise<HostedAppSoftwareUpdateMode> {
  const status = await getSystemUpdateStatus(config, commandRunner)

  return status.canAutoUpdate ? "git_sync_update" : "clean_rebuild"
}

export async function getHostedAppsStatus(
  config: ServerConfig,
  options: {
    commandRunner?: HostedAppsCommandRunner
    fetcher?: HostedAppsFetch
  } = {}
): Promise<HostedAppsStatusResponse> {
  const commandRunner = options.commandRunner ?? runCommand
  const fetcher = options.fetcher ?? fetch
  const rootPath = resolveRuntimeSettingsRoot(config)
  const clientConfigs = readHostedClientConfigs(rootPath)
  const dockerVersion = await commandRunner("docker", ["version", "--format", "{{.Server.Version}}"], rootPath, true)
  const dockerAvailable = dockerVersion.ok
  const issues = dockerAvailable ? [] : ["Docker is not available to the running framework process."]
  const softwareUpdateMode = await resolveSoftwareUpdateMode(config, commandRunner)

  const items = dockerAvailable
    ? await Promise.all(
        clientConfigs.map(async (client) => {
          const inspect = await getDockerInspect(rootPath, client.containerName, commandRunner)
          const hostPort = inspect.hostPort ?? client.configuredPublicPort
          const liveUrl = hostPort
            ? `http://127.0.0.1:${hostPort}`
            : client.cloudDomain
              ? `https://${client.cloudDomain}`
              : null

          if (inspect.missing) {
            return {
              clientId: client.clientId,
              displayName: client.displayName,
              containerName: client.containerName,
              configuredLocalDomain: client.localDomain,
              configuredCloudDomain: client.cloudDomain,
              configuredPublicPort: client.configuredPublicPort,
              hostPort,
              dockerState: "missing" as const,
              healthState: "down" as const,
              healthMessage: "Container is not present on this host.",
              running: false,
              reachable: false,
              startedAt: null,
              image: null,
              liveUrl,
            }
          }

          if (!inspect.running) {
            return {
              clientId: client.clientId,
              displayName: client.displayName,
              containerName: client.containerName,
              configuredLocalDomain: client.localDomain,
              configuredCloudDomain: client.cloudDomain,
              configuredPublicPort: client.configuredPublicPort,
              hostPort,
              dockerState: "exited" as const,
              healthState: "down" as const,
              healthMessage: "Container exists but is not running.",
              running: false,
              reachable: false,
              startedAt: inspect.startedAt,
              image: inspect.image,
              liveUrl,
            }
          }

          if (!hostPort) {
            return {
              clientId: client.clientId,
              displayName: client.displayName,
              containerName: client.containerName,
              configuredLocalDomain: client.localDomain,
              configuredCloudDomain: client.cloudDomain,
              configuredPublicPort: client.configuredPublicPort,
              hostPort: null,
              dockerState: "running" as const,
              healthState: "unknown" as const,
              healthMessage: "Container is running but no host port could be resolved.",
              running: true,
              reachable: false,
              startedAt: inspect.startedAt,
              image: inspect.image,
              liveUrl,
            }
          }

          const health = await readHealthState(hostPort, config.frontendHttpsPort === 443 || config.tlsEnabled ? "https" : "http", fetcher)

          return {
            clientId: client.clientId,
            displayName: client.displayName,
            containerName: client.containerName,
            configuredLocalDomain: client.localDomain,
            configuredCloudDomain: client.cloudDomain,
            configuredPublicPort: client.configuredPublicPort,
            hostPort,
            dockerState: "running" as const,
            healthState: health.healthState,
            healthMessage: health.healthMessage,
            running: true,
            reachable: health.reachable,
            startedAt: inspect.startedAt,
            image: inspect.image,
            liveUrl,
          }
        })
      )
    : clientConfigs.map((client) => ({
        clientId: client.clientId,
        displayName: client.displayName,
        containerName: client.containerName,
        configuredLocalDomain: client.localDomain,
        configuredCloudDomain: client.cloudDomain,
        configuredPublicPort: client.configuredPublicPort,
        hostPort: client.configuredPublicPort,
        dockerState: "unknown" as const,
        healthState: "unknown" as const,
        healthMessage: "Docker is not available to inspect this host.",
        running: false,
        reachable: false,
        startedAt: null,
        image: null,
        liveUrl:
          client.configuredPublicPort != null
            ? `http://127.0.0.1:${client.configuredPublicPort}`
            : null,
      }))

  return hostedAppsStatusResponseSchema.parse({
    generatedAt: new Date().toISOString(),
    dockerAvailable,
    issues,
    softwareUpdateMode,
    items,
    summary: summarizeHostedApps(items),
  })
}

export async function runHostedAppsCleanSoftwareUpdate(
  config: ServerConfig,
  options: {
    commandRunner?: HostedAppsCommandRunner
    actor?: string | null
  } = {}
): Promise<HostedAppsSoftwareUpdateResponse> {
  const commandRunner = options.commandRunner ?? runCommand
  const status = await getSystemUpdateStatus(config, commandRunner)

  if (status.canAutoUpdate) {
    const response = await runSystemUpdate(config, commandRunner, options.actor ?? null)

    return hostedAppsSoftwareUpdateResponseSchema.parse({
      mode: "git_sync_update",
      restartScheduled: response.restartScheduled,
      message: response.message,
      currentCommit: response.currentCommit,
      previousCommit: response.previousCommit,
      clearedPaths: [],
      rootPath: response.status.rootPath,
      status: response.status,
    })
  }

  const response = await runDeveloperOperation(
    config,
    {
      action: "force_clean_rebuild",
    },
    commandRunner
  )

  return hostedAppsSoftwareUpdateResponseSchema.parse({
    mode: "clean_rebuild",
    restartScheduled: response.restartScheduled,
    message: response.message,
    currentCommit: null,
    previousCommit: null,
    clearedPaths: response.clearedPaths,
    rootPath: response.rootPath,
    status: null,
  })
}
