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
  type FrappeConnectionVerificationResponse,
  type FrappeSettingsUpdatePayload,
} from "../../shared/index.js"

import { frappeTableNames } from "../../database/table-names.js"
import { assertSuperAdmin } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
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
  settings: FrappeSettingsUpdatePayload
): Promise<FrappeConnectionVerificationResponse> {
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
    settings: {
      ...settings,
      isConfigured: isConfigured(settings),
    },
  })
}

export async function saveFrappeSettings(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const settings = normalizeSettings(payload)
  validateConnectionPayload(settings, false)
  const storedSettings = frappeSettingsSchema.parse({
    ...settings,
    isConfigured: isConfigured(settings),
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
  user: AuthUser,
  payload: unknown
) {
  assertSuperAdmin(user)

  const settings = normalizeSettings(payload)
  validateConnectionPayload(settings, true)

  return verifyAgainstFrappe(settings)
}
