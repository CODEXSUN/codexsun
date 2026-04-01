import {
  frappeConnectionVerificationResponseSchema,
  frappeSettingsResponseSchema,
  frappeSettingsUpdatePayloadSchema,
  type AuthUser,
  type FrappeSettingsUpdatePayload,
} from '@shared/index'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'
import {
  environment,
  reloadEnvironment,
  updateEnvironmentFile,
} from '@framework-core/runtime/config/environment'

function assertSuperAdmin(user: AuthUser) {
  if (!user.isSuperAdmin) {
    throw new ApplicationError('Super admin access is required.', {}, 403)
  }
}

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, '')
}

function assertHttpUrl(value: string, fieldName: string) {
  if (!value) {
    return
  }

  let parsedUrl: URL

  try {
    parsedUrl = new URL(value)
  } catch {
    throw new ApplicationError(`${fieldName} must be a valid HTTP or HTTPS URL.`, { field: fieldName }, 400)
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new ApplicationError(`${fieldName} must use HTTP or HTTPS.`, { field: fieldName }, 400)
  }
}

function isConfigured(settings: FrappeSettingsUpdatePayload) {
  return Boolean(settings.baseUrl && settings.apiKey && settings.apiSecret)
}

function getFrappeSettings() {
  return frappeSettingsResponseSchema.parse({
    settings: {
      enabled: environment.frappe.enabled,
      baseUrl: environment.frappe.baseUrl,
      siteName: environment.frappe.siteName,
      apiKey: environment.frappe.apiKey,
      apiSecret: environment.frappe.apiSecret,
      timeoutSeconds: environment.frappe.timeoutSeconds,
      defaultCompany: environment.frappe.defaultCompany,
      defaultWarehouse: environment.frappe.defaultWarehouse,
      defaultPriceList: environment.frappe.defaultPriceList,
      defaultCustomerGroup: environment.frappe.defaultCustomerGroup,
      defaultItemGroup: environment.frappe.defaultItemGroup,
      isConfigured: isConfigured({
        enabled: environment.frappe.enabled,
        baseUrl: environment.frappe.baseUrl,
        siteName: environment.frappe.siteName,
        apiKey: environment.frappe.apiKey,
        apiSecret: environment.frappe.apiSecret,
        timeoutSeconds: environment.frappe.timeoutSeconds,
        defaultCompany: environment.frappe.defaultCompany,
        defaultWarehouse: environment.frappe.defaultWarehouse,
        defaultPriceList: environment.frappe.defaultPriceList,
        defaultCustomerGroup: environment.frappe.defaultCustomerGroup,
        defaultItemGroup: environment.frappe.defaultItemGroup,
      }),
    },
  })
}

function validateConnectionPayload(settings: FrappeSettingsUpdatePayload, requireCredentials: boolean) {
  assertHttpUrl(settings.baseUrl, 'FRAPPE_BASE_URL')

  if (!requireCredentials && !settings.enabled) {
    return
  }

  if (!settings.baseUrl) {
    throw new ApplicationError('ERPNext base URL is required.', { field: 'baseUrl' }, 400)
  }

  if (!settings.apiKey) {
    throw new ApplicationError('ERPNext API key is required.', { field: 'apiKey' }, 400)
  }

  if (!settings.apiSecret) {
    throw new ApplicationError('ERPNext API secret is required.', { field: 'apiSecret' }, 400)
  }
}

function toNormalizedSettings(payload: unknown) {
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
  } satisfies FrappeSettingsUpdatePayload
}

async function readResponseText(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null

    const detail = [
      typeof payload?.message === 'string' ? payload.message : '',
      typeof payload?.exception === 'string' ? payload.exception : '',
      typeof payload?.exc_type === 'string' ? payload.exc_type : '',
    ]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' | ')

    return detail || `HTTP ${response.status}`
  }

  return (await response.text().catch(() => '')).trim() || `HTTP ${response.status}`
}

async function verifyAgainstFrappe(settings: FrappeSettingsUpdatePayload) {
  const headers = new Headers({
    authorization: `token ${settings.apiKey}:${settings.apiSecret}`,
    accept: 'application/json',
  })

  if (settings.siteName) {
    headers.set('x-frappe-site-name', settings.siteName)
  }

  try {
    const response = await fetch(`${settings.baseUrl}/api/method/frappe.auth.get_logged_user`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(settings.timeoutSeconds * 1000),
    })

    if (!response.ok) {
      const detail = await readResponseText(response)
      return frappeConnectionVerificationResponseSchema.parse({
        verification: {
          ok: false,
          message: 'ERPNext rejected the connection request.',
          detail,
          serverUrl: settings.baseUrl,
          siteName: settings.siteName,
          connectedUser: '',
        },
      })
    }

    const payload = await response.json().catch(() => null) as { message?: unknown } | null
    const connectedUser = typeof payload?.message === 'string' ? payload.message : ''

    return frappeConnectionVerificationResponseSchema.parse({
      verification: {
        ok: true,
        message: 'ERPNext connection verified.',
        detail: connectedUser ? `Authenticated as ${connectedUser}.` : 'ERPNext responded successfully.',
        serverUrl: settings.baseUrl,
        siteName: settings.siteName,
        connectedUser,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connection error.'

    return frappeConnectionVerificationResponseSchema.parse({
      verification: {
        ok: false,
        message: 'Unable to reach ERPNext.',
        detail: message,
        serverUrl: settings.baseUrl,
        siteName: settings.siteName,
        connectedUser: '',
      },
    })
  }
}

export function readFrappeSettings(user: AuthUser) {
  assertSuperAdmin(user)
  return getFrappeSettings()
}

export function saveFrappeSettings(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const settings = toNormalizedSettings(payload)
  validateConnectionPayload(settings, false)

  updateEnvironmentFile({
    FRAPPE_ENABLED: String(settings.enabled),
    FRAPPE_BASE_URL: settings.baseUrl,
    FRAPPE_SITE_NAME: settings.siteName,
    FRAPPE_API_KEY: settings.apiKey,
    FRAPPE_API_SECRET: settings.apiSecret,
    FRAPPE_TIMEOUT_SECONDS: String(settings.timeoutSeconds),
    FRAPPE_DEFAULT_COMPANY: settings.defaultCompany,
    FRAPPE_DEFAULT_WAREHOUSE: settings.defaultWarehouse,
    FRAPPE_DEFAULT_PRICE_LIST: settings.defaultPriceList,
    FRAPPE_DEFAULT_CUSTOMER_GROUP: settings.defaultCustomerGroup,
    FRAPPE_DEFAULT_ITEM_GROUP: settings.defaultItemGroup,
  })
  reloadEnvironment()

  return getFrappeSettings()
}

export async function verifyFrappeSettings(user: AuthUser, payload: unknown) {
  assertSuperAdmin(user)

  const settings = toNormalizedSettings(payload)
  validateConnectionPayload(settings, true)

  return verifyAgainstFrappe(settings)
}
