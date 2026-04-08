import type { Kysely } from "kysely"

import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  defaultFrappeVerificationResponse,
  frappeSettings as defaultFrappeSettings,
} from "../data/frappe-seed.js"
import {
  frappeConnectionVerificationResponseSchema,
  frappeSettingsResponseSchema,
  frappeSettingsSchema,
  frappeSettingsUpdatePayloadSchema,
  frappeSettingsVerificationPayloadSchema,
  type FrappeConnectionVerification,
  type FrappeConnectionVerificationResponse,
  type FrappeSettings,
  type FrappeSettingsUpdatePayload,
  type FrappeSettingsVerificationPayload,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import { assertSuperAdmin } from "./access.js"
import { recordFrappeConnectorEvent } from "./observability-service.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

function currentTimestamp() {
  return new Date().toISOString()
}

function assertHttpUrl(value: string, fieldName: string) {
  if (!value) {
    return
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(value)
  } catch {
    throw new ApplicationError(
      `${fieldName} must be a valid HTTP or HTTPS URL.`,
      { field: fieldName },
      400
    )
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ApplicationError(
      `${fieldName} must use HTTP or HTTPS.`,
      { field: fieldName },
      400
    )
  }
}

function isConfigured(settings: FrappeSettingsUpdatePayload) {
  return Boolean(settings.baseUrl && settings.apiKey && settings.apiSecret)
}

function validateConnectionPayload(
  settings: FrappeSettingsUpdatePayload,
  requireCredentials: boolean
) {
  assertHttpUrl(settings.baseUrl, "FRAPPE_BASE_URL")

  if (!requireCredentials && !settings.enabled) {
    return
  }

  if (!settings.baseUrl) {
    throw new ApplicationError(
      "ERPNext base URL is required.",
      { field: "baseUrl" },
      400
    )
  }

  if (!settings.apiKey) {
    throw new ApplicationError(
      "ERPNext API key is required.",
      { field: "apiKey" },
      400
    )
  }

  if (!settings.apiSecret) {
    throw new ApplicationError(
      "ERPNext API secret is required.",
      { field: "apiSecret" },
      400
    )
  }
}

function normalizeSettings(payload: unknown): FrappeSettingsUpdatePayload {
  const parsedPayload = frappeSettingsUpdatePayloadSchema.parse(payload)

  return {
    ...parsedPayload,
    baseUrl: normalizeBaseUrl(parsedPayload.baseUrl),
    siteName: parsedPayload.siteName.trim(),
    apiKey: parsedPayload.apiKey.trim(),
    apiSecret: parsedPayload.apiSecret.trim(),
    defaultCompany: parsedPayload.defaultCompany.trim(),
    defaultWarehouse: parsedPayload.defaultWarehouse.trim(),
    defaultPriceList: parsedPayload.defaultPriceList.trim(),
    defaultCustomerGroup: parsedPayload.defaultCustomerGroup.trim(),
    defaultItemGroup: parsedPayload.defaultItemGroup.trim(),
  }
}

function normalizeVerificationPayload(
  payload: unknown
): FrappeSettingsVerificationPayload {
  const parsedPayload = frappeSettingsVerificationPayloadSchema.parse(payload ?? {})

  return {
    ...parsedPayload,
    baseUrl:
      typeof parsedPayload.baseUrl === "string"
        ? normalizeBaseUrl(parsedPayload.baseUrl)
        : undefined,
    siteName:
      typeof parsedPayload.siteName === "string"
        ? parsedPayload.siteName.trim()
        : undefined,
    apiKey:
      typeof parsedPayload.apiKey === "string"
        ? parsedPayload.apiKey.trim()
        : undefined,
    apiSecret:
      typeof parsedPayload.apiSecret === "string"
        ? parsedPayload.apiSecret.trim()
        : undefined,
    defaultCompany:
      typeof parsedPayload.defaultCompany === "string"
        ? parsedPayload.defaultCompany.trim()
        : undefined,
    defaultWarehouse:
      typeof parsedPayload.defaultWarehouse === "string"
        ? parsedPayload.defaultWarehouse.trim()
        : undefined,
    defaultPriceList:
      typeof parsedPayload.defaultPriceList === "string"
        ? parsedPayload.defaultPriceList.trim()
        : undefined,
    defaultCustomerGroup:
      typeof parsedPayload.defaultCustomerGroup === "string"
        ? parsedPayload.defaultCustomerGroup.trim()
        : undefined,
    defaultItemGroup:
      typeof parsedPayload.defaultItemGroup === "string"
        ? parsedPayload.defaultItemGroup.trim()
        : undefined,
  }
}

function toUpdatePayload(settings: FrappeSettings): FrappeSettingsUpdatePayload {
  return {
    enabled: settings.enabled,
    baseUrl: settings.baseUrl,
    siteName: settings.siteName,
    apiKey: settings.apiKey,
    apiSecret: settings.apiSecret,
    timeoutSeconds: settings.timeoutSeconds,
    defaultCompany: settings.defaultCompany,
    defaultWarehouse: settings.defaultWarehouse,
    defaultPriceList: settings.defaultPriceList,
    defaultCustomerGroup: settings.defaultCustomerGroup,
    defaultItemGroup: settings.defaultItemGroup,
  }
}

function mergeSettings(
  previousSettings: FrappeSettings,
  nextSettings: FrappeSettingsUpdatePayload
): FrappeSettingsUpdatePayload {
  return {
    ...nextSettings,
    apiKey: nextSettings.apiKey || previousSettings.apiKey,
    apiSecret: nextSettings.apiSecret || previousSettings.apiSecret,
  }
}

function mergeVerificationSettings(
  previousSettings: FrappeSettings,
  nextSettings: FrappeSettingsVerificationPayload
) {
  const previousPayload = toUpdatePayload(previousSettings)

  return {
    ...previousPayload,
    ...nextSettings,
    baseUrl: nextSettings.baseUrl ?? previousPayload.baseUrl,
    siteName: nextSettings.siteName ?? previousPayload.siteName,
    apiKey:
      nextSettings.apiKey === undefined || nextSettings.apiKey === ""
        ? previousPayload.apiKey
        : nextSettings.apiKey,
    apiSecret:
      nextSettings.apiSecret === undefined || nextSettings.apiSecret === ""
        ? previousPayload.apiSecret
        : nextSettings.apiSecret,
    timeoutSeconds: nextSettings.timeoutSeconds ?? previousPayload.timeoutSeconds,
    defaultCompany: nextSettings.defaultCompany ?? previousPayload.defaultCompany,
    defaultWarehouse:
      nextSettings.defaultWarehouse ?? previousPayload.defaultWarehouse,
    defaultPriceList:
      nextSettings.defaultPriceList ?? previousPayload.defaultPriceList,
    defaultCustomerGroup:
      nextSettings.defaultCustomerGroup ?? previousPayload.defaultCustomerGroup,
    defaultItemGroup:
      nextSettings.defaultItemGroup ?? previousPayload.defaultItemGroup,
  } satisfies FrappeSettingsUpdatePayload
}

function shouldResetVerification(
  previousSettings: FrappeSettings,
  nextSettings: FrappeSettingsUpdatePayload
) {
  return (
    previousSettings.baseUrl !== nextSettings.baseUrl ||
    previousSettings.siteName !== nextSettings.siteName ||
    previousSettings.apiKey !== nextSettings.apiKey ||
    previousSettings.apiSecret !== nextSettings.apiSecret ||
    previousSettings.timeoutSeconds !== nextSettings.timeoutSeconds
  )
}

function matchesStoredSettings(
  previousSettings: FrappeSettings,
  nextSettings: FrappeSettingsUpdatePayload
) {
  return (
    previousSettings.enabled === nextSettings.enabled &&
    previousSettings.baseUrl === nextSettings.baseUrl &&
    previousSettings.siteName === nextSettings.siteName &&
    previousSettings.apiKey === nextSettings.apiKey &&
    previousSettings.apiSecret === nextSettings.apiSecret &&
    previousSettings.timeoutSeconds === nextSettings.timeoutSeconds &&
    previousSettings.defaultCompany === nextSettings.defaultCompany &&
    previousSettings.defaultWarehouse === nextSettings.defaultWarehouse &&
    previousSettings.defaultPriceList === nextSettings.defaultPriceList &&
    previousSettings.defaultCustomerGroup === nextSettings.defaultCustomerGroup &&
    previousSettings.defaultItemGroup === nextSettings.defaultItemGroup
  )
}

function applyVerificationStatus(
  settings: FrappeSettings,
  verification: FrappeConnectionVerification
) {
  return frappeSettingsSchema.parse({
    ...settings,
    hasApiKey: Boolean(settings.apiKey),
    hasApiSecret: Boolean(settings.apiSecret),
    isConfigured: isConfigured(toUpdatePayload(settings)),
    lastVerifiedAt: verification.verifiedAt,
    lastVerificationStatus: verification.ok ? "passed" : "failed",
    lastVerificationMessage: verification.message,
    lastVerificationDetail: verification.detail,
  })
}

function sanitizeSettings(settings: FrappeSettings) {
  return frappeSettingsSchema.parse({
    ...settings,
    apiKey: "",
    apiSecret: "",
    hasApiKey: Boolean(settings.apiKey),
    hasApiSecret: Boolean(settings.apiSecret),
    isConfigured: isConfigured(toUpdatePayload(settings)),
  })
}

async function readResponseText(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const payload = (await response.json().catch(() => null)) as
      | Record<string, unknown>
      | null

    const detail = [
      typeof payload?.message === "string" ? payload.message : "",
      typeof payload?.exception === "string" ? payload.exception : "",
      typeof payload?.exc_type === "string" ? payload.exc_type : "",
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" | ")

    return detail || `HTTP ${response.status}`
  }

  return (await response.text().catch(() => "")).trim() || `HTTP ${response.status}`
}

async function readStoredSettings(database: Kysely<unknown>) {
  const [settings] = await listStorePayloads(
    database,
    frappeTableNames.settings,
    frappeSettingsSchema
  )

  return settings ?? defaultFrappeSettings
}

async function verifyAgainstFrappe(
  settings: FrappeSettingsUpdatePayload,
  usedSavedCredentials: boolean
): Promise<FrappeConnectionVerificationResponse> {
  const verifiedAt = currentTimestamp()

  if (!isConfigured(settings)) {
    return defaultFrappeVerificationResponse
  }

  const headers = new Headers({
    authorization: `token ${settings.apiKey}:${settings.apiSecret}`,
    accept: "application/json",
  })

  if (settings.siteName) {
    headers.set("x-frappe-site-name", settings.siteName)
  }

  try {
    const response = await fetch(
      `${settings.baseUrl}/api/method/frappe.auth.get_logged_user`,
      {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(settings.timeoutSeconds * 1000),
      }
    )

    if (!response.ok) {
      const detail = await readResponseText(response)

      return frappeConnectionVerificationResponseSchema.parse({
        verification: {
          ok: false,
          message: "ERPNext rejected the connection request.",
          detail,
          serverUrl: settings.baseUrl,
          siteName: settings.siteName,
          connectedUser: "",
          verifiedAt,
          usedSavedCredentials,
          persistedToSettings: false,
        },
      })
    }

    const payload = (await response.json().catch(() => null)) as
      | { message?: unknown }
      | null
    const connectedUser =
      typeof payload?.message === "string" ? payload.message : ""

    return frappeConnectionVerificationResponseSchema.parse({
        verification: {
          ok: true,
          message: "ERPNext connection verified.",
          detail: connectedUser
            ? `Authenticated as ${connectedUser}.`
            : "ERPNext responded successfully.",
          serverUrl: settings.baseUrl,
          siteName: settings.siteName,
          connectedUser,
          verifiedAt,
          usedSavedCredentials,
          persistedToSettings: false,
        },
      })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown connection error."

    return frappeConnectionVerificationResponseSchema.parse({
        verification: {
          ok: false,
          message: "Unable to reach ERPNext.",
          detail: message,
          serverUrl: settings.baseUrl,
          siteName: settings.siteName,
          connectedUser: "",
          verifiedAt,
          usedSavedCredentials,
          persistedToSettings: false,
        },
      })
  }
}

export async function readFrappeSettings(
  database: Kysely<unknown>,
  user: AuthUser
) {
  assertSuperAdmin(user)

  const settings = await readStoredSettings(database)

  return frappeSettingsResponseSchema.parse({
    settings: sanitizeSettings(settings),
  })
}

export async function saveFrappeSettings(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const previousSettings = await readStoredSettings(database)
  const nextSettings = mergeSettings(previousSettings, normalizeSettings(payload))

  validateConnectionPayload(nextSettings, false)
  const shouldInvalidateVerification = shouldResetVerification(
    previousSettings,
    nextSettings
  )
  const storedSettings = frappeSettingsSchema.parse({
    ...previousSettings,
    ...nextSettings,
    hasApiKey: Boolean(nextSettings.apiKey),
    hasApiSecret: Boolean(nextSettings.apiSecret),
    isConfigured: isConfigured(nextSettings),
    lastVerifiedAt: shouldInvalidateVerification
      ? ""
      : previousSettings.lastVerifiedAt,
    lastVerificationStatus: shouldInvalidateVerification
      ? "idle"
      : previousSettings.lastVerificationStatus,
    lastVerificationMessage: shouldInvalidateVerification
      ? ""
      : previousSettings.lastVerificationMessage,
    lastVerificationDetail: shouldInvalidateVerification
      ? ""
      : previousSettings.lastVerificationDetail,
  })

  await replaceStorePayloads(database, frappeTableNames.settings, [
    {
      id: "frappe-settings:default",
      moduleKey: "settings",
      sortOrder: 1,
      payload: storedSettings,
    },
  ])

  return readFrappeSettings(database, user)
}

export async function verifyFrappeSettings(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const previousSettings = await readStoredSettings(database)
  const verificationPayload = normalizeVerificationPayload(payload)
  const settings = mergeVerificationSettings(previousSettings, verificationPayload)
  const usedSavedCredentials =
    ((verificationPayload.apiKey ?? "") === "" && Boolean(previousSettings.apiKey)) ||
    ((verificationPayload.apiSecret ?? "") === "" &&
      Boolean(previousSettings.apiSecret))

  validateConnectionPayload(settings, true)

  const verificationResponse = await verifyAgainstFrappe(
    settings,
    usedSavedCredentials
  )

  await recordFrappeConnectorEvent(database, user, {
    action: "settings.verify",
    status: verificationResponse.verification.ok ? "success" : "failure",
    message: verificationResponse.verification.message,
    referenceId: "frappe-settings:default",
    details: {
      persistedToSettings: verificationResponse.verification.persistedToSettings,
      usedSavedCredentials: verificationResponse.verification.usedSavedCredentials,
      serverUrl: verificationResponse.verification.serverUrl,
      siteName: verificationResponse.verification.siteName,
    },
  })

  if (!matchesStoredSettings(previousSettings, settings)) {
    return verificationResponse
  }

  const persistedSettings = applyVerificationStatus(
    previousSettings,
    verificationResponse.verification
  )

  await replaceStorePayloads(database, frappeTableNames.settings, [
    {
      id: "frappe-settings:default",
      moduleKey: "settings",
      sortOrder: 1,
      payload: persistedSettings,
    },
  ])

  return frappeConnectionVerificationResponseSchema.parse({
    verification: {
      ...verificationResponse.verification,
      persistedToSettings: true,
    },
  })
}
