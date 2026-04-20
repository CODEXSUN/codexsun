import path from "node:path"

import type { Kysely } from "kysely"
import { z } from "zod"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import {
  frappeConnectionVerificationResponseSchema,
  frappeSettingsResponseSchema,
  frappeSettingsSchema,
  frappeSettingsUpdatePayloadSchema,
  type FrappeSettings,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import {
  frappeEnvKeys,
  readFrappeEnvConfig,
  type FrappeEnvConfig as RuntimeFrappeEnvConfig,
  writeFrappeEnvConfig,
} from "../config/frappe.js"
import { parseEnvFile } from "../../../framework/src/runtime/config/env.js"
import { assertSuperAdmin } from "./access.js"
import {
  createFrappeConnection,
  readFrappeErrorText,
} from "./connection.js"
import { recordFrappeConnectorEvent } from "./observability-service.js"
import { listStorePayloadsRaw, replaceStorePayloads } from "./store.js"

const verificationStateSchema = z.object({
  configFingerprint: z.string().trim(),
  lastVerifiedAt: z.string().trim(),
  lastVerificationStatus: z.enum(["idle", "passed", "failed"]),
  lastVerificationMessage: z.string().trim(),
  lastVerificationDetail: z.string().trim(),
  lastVerifiedUser: z.string().trim(),
  lastVerifiedLatencyMs: z.number().int().nonnegative().nullable(),
})

type FrappeVerificationState = z.infer<typeof verificationStateSchema>

const defaultVerificationState: FrappeVerificationState = {
  configFingerprint: "",
  lastVerifiedAt: "",
  lastVerificationStatus: "idle",
  lastVerificationMessage: "",
  lastVerificationDetail: "",
  lastVerifiedUser: "",
  lastVerifiedLatencyMs: null,
}

type FrappeSettingsServiceOptions = {
  config?: RuntimeFrappeEnvConfig
  cwd?: string
}

function resolveConfig(options?: FrappeSettingsServiceOptions) {
  return options?.config ?? readFrappeEnvConfig(options?.cwd)
}

function readRawFrappeEnvValues(cwd = process.cwd()) {
  const env = parseEnvFile(path.resolve(cwd, ".env"))

  return Object.fromEntries(
    frappeEnvKeys.map((key) => [key, env[key]?.trim() ?? ""])
  ) as Record<(typeof frappeEnvKeys)[number], string>
}

function parseLooseBoolean(value: string) {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase())
}

function parseTimeoutFallback(value: string) {
  const parsed = Number.parseInt(value.trim(), 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 30
  }

  return Math.min(parsed, 120)
}

function normalizeStoredVerificationState(payload: unknown) {
  const candidate =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {}

  return verificationStateSchema.parse({
    configFingerprint:
      typeof candidate.configFingerprint === "string"
        ? candidate.configFingerprint.trim()
        : "",
    lastVerifiedAt:
      typeof candidate.lastVerifiedAt === "string"
        ? candidate.lastVerifiedAt.trim()
        : "",
    lastVerificationStatus:
      candidate.lastVerificationStatus === "passed" ||
      candidate.lastVerificationStatus === "failed" ||
      candidate.lastVerificationStatus === "idle"
        ? candidate.lastVerificationStatus
        : "idle",
    lastVerificationMessage:
      typeof candidate.lastVerificationMessage === "string"
        ? candidate.lastVerificationMessage.trim()
        : "",
    lastVerificationDetail:
      typeof candidate.lastVerificationDetail === "string"
        ? candidate.lastVerificationDetail.trim()
        : "",
    lastVerifiedUser:
      typeof candidate.lastVerifiedUser === "string"
        ? candidate.lastVerifiedUser.trim()
        : typeof candidate.connectedUser === "string"
          ? candidate.connectedUser.trim()
          : "",
    lastVerifiedLatencyMs:
      typeof candidate.lastVerifiedLatencyMs === "number" &&
      Number.isFinite(candidate.lastVerifiedLatencyMs) &&
      candidate.lastVerifiedLatencyMs >= 0
        ? Math.round(candidate.lastVerifiedLatencyMs)
        : null,
  })
}

async function readStoredVerificationState(database: Kysely<unknown>) {
  const [state] = await listStorePayloadsRaw(database, frappeTableNames.settings)

  if (!state) {
    return defaultVerificationState
  }

  return normalizeStoredVerificationState(state)
}

async function persistVerificationState(
  database: Kysely<unknown>,
  state: FrappeVerificationState
) {
  await replaceStorePayloads(database, frappeTableNames.settings, [
    {
      id: "frappe-settings:verification",
      moduleKey: "settings",
      sortOrder: 1,
      payload: state,
      updatedAt: state.lastVerifiedAt || new Date().toISOString(),
    },
  ])
}

function toFrappeSettings(
  config: RuntimeFrappeEnvConfig,
  verificationState: FrappeVerificationState
): FrappeSettings {
  const matchingState =
    verificationState.configFingerprint === config.configFingerprint
      ? verificationState
      : defaultVerificationState

  return frappeSettingsSchema.parse({
    enabled: config.enabled,
    baseUrl: config.baseUrl,
    siteName: config.siteName,
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    hasApiKey: config.apiKey.length > 0,
    hasApiSecret: config.apiSecret.length > 0,
    timeoutSeconds: config.timeoutSeconds,
    defaultCompany: config.defaultCompany,
    defaultWarehouse: config.defaultWarehouse,
    isConfigured: true,
    configSource: "env",
    lastVerifiedAt: matchingState.lastVerifiedAt,
    lastVerificationStatus: matchingState.lastVerificationStatus,
    lastVerificationMessage: matchingState.lastVerificationMessage,
    lastVerificationDetail: matchingState.lastVerificationDetail,
    lastVerifiedUser: matchingState.lastVerifiedUser,
    lastVerifiedLatencyMs: matchingState.lastVerifiedLatencyMs,
  })
}

function toInvalidFrappeSettings(
  verificationState: FrappeVerificationState,
  error: unknown,
  cwd?: string
): FrappeSettings {
  const rawValues = readRawFrappeEnvValues(cwd)
  const detail = error instanceof Error ? error.message : "Unknown Frappe env config error."

  return frappeSettingsSchema.parse({
    enabled: parseLooseBoolean(rawValues.FRAPPE_ENABLED),
    baseUrl: rawValues.FRAPPE_BASE_URL,
    siteName: rawValues.FRAPPE_SITE_NAME,
    apiKey: rawValues.FRAPPE_API_KEY,
    apiSecret: rawValues.FRAPPE_API_SECRET,
    hasApiKey: rawValues.FRAPPE_API_KEY.length > 0,
    hasApiSecret: rawValues.FRAPPE_API_SECRET.length > 0,
    timeoutSeconds: parseTimeoutFallback(rawValues.FRAPPE_TIMEOUT_SECONDS),
    defaultCompany: rawValues.FRAPPE_DEFAULT_COMPANY,
    defaultWarehouse: rawValues.FRAPPE_DEFAULT_WAREHOUSE,
    isConfigured: false,
    configSource: "env",
    lastVerifiedAt: verificationState.lastVerifiedAt,
    lastVerificationStatus: "failed",
    lastVerificationMessage: "Frappe env configuration is invalid.",
    lastVerificationDetail: detail,
    lastVerifiedUser: verificationState.lastVerifiedUser,
    lastVerifiedLatencyMs: verificationState.lastVerifiedLatencyMs,
  })
}

async function recordInvalidConfig(
  database: Kysely<unknown>,
  user: AuthUser,
  error: unknown
) {
  await recordFrappeConnectorEvent(database, user, {
    action: "settings.verify",
    status: "failure",
    message: "Frappe env configuration is invalid.",
    referenceId: "frappe-settings:verification",
    details: {
      error:
        error instanceof Error ? error.message : "Unknown Frappe env config error.",
    },
  })
}

export async function readStoredFrappeSettings(
  database: Kysely<unknown>,
  options?: FrappeSettingsServiceOptions
) {
  const verificationState = await readStoredVerificationState(database)

  try {
    const config = resolveConfig(options)

    return toFrappeSettings(config, verificationState)
  } catch (error) {
    return toInvalidFrappeSettings(verificationState, error, options?.cwd)
  }
}

export async function readFrappeSettings(
  database: Kysely<unknown>,
  user: AuthUser,
  options?: FrappeSettingsServiceOptions
) {
  assertSuperAdmin(user)

  return frappeSettingsResponseSchema.parse({
    settings: await readStoredFrappeSettings(database, options),
  })
}

export async function saveFrappeSettings(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown,
  options?: FrappeSettingsServiceOptions
) {
  assertSuperAdmin(user)

  try {
    const parsedPayload = frappeSettingsUpdatePayloadSchema.parse(payload)
    const config = writeFrappeEnvConfig(parsedPayload, options?.cwd)

    await recordFrappeConnectorEvent(database, user, {
      action: "settings.save",
      status: "success",
      message: "Frappe env contract saved.",
      referenceId: "frappe-settings:env",
      details: {
        serverUrl: config.baseUrl,
        siteName: config.siteName,
        timeoutSeconds: config.timeoutSeconds,
      },
    })

    return frappeSettingsResponseSchema.parse({
      settings: await readStoredFrappeSettings(database, {
        config,
        cwd: options?.cwd,
      }),
    })
  } catch (error) {
    await recordFrappeConnectorEvent(database, user, {
      action: "settings.save",
      status: "failure",
      message: "Frappe env contract save failed.",
      referenceId: "frappe-settings:env",
      details: {
        error:
          error instanceof Error ? error.message : "Unknown Frappe env save error.",
      },
    })

    throw error
  }
}

export async function verifyFrappeSettings(
  database: Kysely<unknown>,
  user: AuthUser,
  _payload?: unknown,
  options?: FrappeSettingsServiceOptions
) {
  assertSuperAdmin(user)

  let config: RuntimeFrappeEnvConfig

  try {
    config = resolveConfig(options)
  } catch (error) {
    await recordInvalidConfig(database, user, error)
    throw error
  }

  const connection = createFrappeConnection(config)
  const verifiedAt = new Date().toISOString()

  try {
    const { response, latencyMs } = await connection.request({
      path: "/api/method/frappe.auth.get_logged_user",
    })

    if (!response.ok) {
      const errorDetail = await readFrappeErrorText(response)
      const verificationState = verificationStateSchema.parse({
        configFingerprint: config.configFingerprint,
        lastVerifiedAt: verifiedAt,
        lastVerificationStatus: "failed",
        lastVerificationMessage: "ERPNext rejected the connection request.",
        lastVerificationDetail: errorDetail,
        lastVerifiedUser: "",
        lastVerifiedLatencyMs: latencyMs,
      })

      await persistVerificationState(database, verificationState)
      await recordFrappeConnectorEvent(database, user, {
        action: "settings.verify",
        status: "failure",
        message: verificationState.lastVerificationMessage,
        referenceId: "frappe-settings:verification",
        details: {
          latencyMs,
          error: errorDetail,
          serverUrl: config.baseUrl,
          siteName: config.siteName,
        },
      })

      return frappeConnectionVerificationResponseSchema.parse({
        verification: {
          status: "failed",
          latencyMs,
          user: "",
          error: errorDetail,
          serverUrl: config.baseUrl,
          siteName: config.siteName,
          verifiedAt,
          persistedToSettings: true,
        },
      })
    }

    const payload = (await response.json().catch(() => null)) as
      | { message?: unknown }
      | null
    const authenticatedUser =
      typeof payload?.message === "string" ? payload.message.trim() : ""

    if (!authenticatedUser) {
      const errorDetail =
        "ERPNext handshake returned HTTP 200 but no authenticated user."
      const verificationState = verificationStateSchema.parse({
        configFingerprint: config.configFingerprint,
        lastVerifiedAt: verifiedAt,
        lastVerificationStatus: "failed",
        lastVerificationMessage: "ERPNext returned an invalid handshake payload.",
        lastVerificationDetail: errorDetail,
        lastVerifiedUser: "",
        lastVerifiedLatencyMs: latencyMs,
      })

      await persistVerificationState(database, verificationState)
      await recordFrappeConnectorEvent(database, user, {
        action: "settings.verify",
        status: "failure",
        message: verificationState.lastVerificationMessage,
        referenceId: "frappe-settings:verification",
        details: {
          latencyMs,
          error: errorDetail,
          serverUrl: config.baseUrl,
          siteName: config.siteName,
        },
      })

      return frappeConnectionVerificationResponseSchema.parse({
        verification: {
          status: "failed",
          latencyMs,
          user: "",
          error: errorDetail,
          serverUrl: config.baseUrl,
          siteName: config.siteName,
          verifiedAt,
          persistedToSettings: true,
        },
      })
    }

    const verificationState = verificationStateSchema.parse({
      configFingerprint: config.configFingerprint,
      lastVerifiedAt: verifiedAt,
      lastVerificationStatus: "passed",
      lastVerificationMessage: "ERPNext connection verified.",
      lastVerificationDetail: `Authenticated as ${authenticatedUser}.`,
      lastVerifiedUser: authenticatedUser,
      lastVerifiedLatencyMs: latencyMs,
    })

    await persistVerificationState(database, verificationState)
    await recordFrappeConnectorEvent(database, user, {
      action: "settings.verify",
      status: "success",
      message: verificationState.lastVerificationMessage,
      referenceId: "frappe-settings:verification",
      details: {
        latencyMs,
        user: authenticatedUser,
        serverUrl: config.baseUrl,
        siteName: config.siteName,
      },
    })

    return frappeConnectionVerificationResponseSchema.parse({
      verification: {
        status: "success",
        latencyMs,
        user: authenticatedUser,
        error: null,
        serverUrl: config.baseUrl,
        siteName: config.siteName,
        verifiedAt,
        persistedToSettings: true,
      },
    })
  } catch (error) {
    const errorDetail =
      error instanceof Error ? error.message : "Unknown ERPNext handshake error."
    const verificationState = verificationStateSchema.parse({
      configFingerprint: config.configFingerprint,
      lastVerifiedAt: verifiedAt,
      lastVerificationStatus: "failed",
      lastVerificationMessage: "Unable to reach ERPNext.",
      lastVerificationDetail: errorDetail,
      lastVerifiedUser: "",
      lastVerifiedLatencyMs: null,
    })

    await persistVerificationState(database, verificationState)
    await recordFrappeConnectorEvent(database, user, {
      action: "settings.verify",
      status: "failure",
      message: verificationState.lastVerificationMessage,
      referenceId: "frappe-settings:verification",
      details: {
        error: errorDetail,
        serverUrl: config.baseUrl,
        siteName: config.siteName,
      },
    })

    return frappeConnectionVerificationResponseSchema.parse({
      verification: {
        status: "failed",
        latencyMs: 0,
        user: "",
        error: errorDetail,
        serverUrl: config.baseUrl,
        siteName: config.siteName,
        verifiedAt,
        persistedToSettings: true,
      },
    })
  }
}
