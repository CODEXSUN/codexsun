import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import {
  runtimeSettingGroups,
  runtimeSettingKeys,
  runtimeSettingsSavePayloadSchema,
  runtimeSettingsSaveResponseSchema,
  runtimeSettingsSnapshotSchema,
  type RuntimeSettingField,
  type RuntimeSettingsSavePayload,
  type RuntimeSettingsSaveResponse,
  type RuntimeSettingsSnapshot,
} from "../../../shared/runtime-settings.js"
import { ApplicationError } from "../errors/application-error.js"
import type { ServerConfig } from "./server-config.js"
import { scheduleFallbackRestart, triggerDevelopmentRestart } from "./runtime-restart.js"

import { parseEnvFile } from "./env.js"
import { getServerConfig } from "./server-config.js"

const defaultGitRepositoryUrl = "https://github.com/CODEXSUN/codexsun.git"
const defaultGitBranch = "main"
const containerRestartSettingKeys = new Set([
  "GIT_SYNC_ENABLED",
  "GIT_REPOSITORY_URL",
  "GIT_BRANCH",
  "GIT_AUTO_UPDATE_ON_START",
  "GIT_FORCE_UPDATE_ON_START",
])

export function resolveRuntimeSettingsRoot(config: ServerConfig) {
  return path.resolve(config.webRoot, "..", "..", "..", "..")
}

function envFilePath(cwd = process.cwd()) {
  return path.resolve(cwd, ".env")
}

function toBooleanValue(value: boolean | string) {
  if (typeof value === "boolean") {
    return value
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

function toStringValue(value: unknown) {
  return value == null ? "" : String(value)
}

function valueFromResolvedConfig(field: RuntimeSettingField, cwd = process.cwd()) {
  const config = getServerConfig(cwd)
  const envValues = parseEnvFile(envFilePath(cwd))
  const valueMap: Record<string, string | boolean> = {
    APP_ENV: config.environment,
    APP_NAME: config.appName,
    APP_HOST: config.appHost,
    APP_DOMAIN: config.appDomain,
    APP_HTTP_PORT: String(config.appHttpPort),
    APP_HTTPS_PORT: String(config.appHttpsPort),
    WEB_ROOT: path.relative(cwd, config.webRoot).replace(/\\/g, "/"),
    CLOUDFLARE_ENABLED: config.cloudflareEnabled,
    TLS_ENABLED: config.tlsEnabled,
    TLS_KEY_PATH: config.tlsKeyPath
      ? path.relative(cwd, config.tlsKeyPath).replace(/\\/g, "/")
      : "",
    TLS_CERT_PATH: config.tlsCertPath
      ? path.relative(cwd, config.tlsCertPath).replace(/\\/g, "/")
      : "",
    FRONTEND_DOMAIN: config.frontendDomain,
    FRONTEND_HOST: config.frontendHost,
    FRONTEND_HTTP_PORT: String(config.frontendHttpPort),
    FRONTEND_HTTPS_PORT: String(config.frontendHttpsPort),
    VITE_FRONTEND_TARGET: config.frontendTarget,
    VITE_TOAST_POSITION: config.notifications.toast.position,
    VITE_TOAST_TONE: config.notifications.toast.tone,
    VITE_SHOW_DEVOPS_NAMES: config.developerTools.showTechnicalNames,
    GIT_SYNC_ENABLED: toBooleanValue(envValues.GIT_SYNC_ENABLED ?? "false"),
    GIT_REPOSITORY_URL: envValues.GIT_REPOSITORY_URL ?? defaultGitRepositoryUrl,
    GIT_BRANCH: envValues.GIT_BRANCH ?? defaultGitBranch,
    GIT_AUTO_UPDATE_ON_START: toBooleanValue(envValues.GIT_AUTO_UPDATE_ON_START ?? "false"),
    GIT_FORCE_UPDATE_ON_START: toBooleanValue(envValues.GIT_FORCE_UPDATE_ON_START ?? "false"),
    DB_DRIVER: config.database.driver,
    DB_HOST: config.database.host ?? "",
    DB_PORT: config.database.port ? String(config.database.port) : "",
    DB_NAME: config.database.name ?? "",
    DB_USER: config.database.user ?? "",
    DB_PASSWORD: config.database.password ?? "",
    DB_SSL: config.database.ssl,
    SQLITE_FILE: path.relative(cwd, config.database.sqliteFile).replace(/\\/g, "/"),
    OFFLINE_SUPPORT_ENABLED: config.offline.enabled,
    ANALYTICS_DB_ENABLED: config.analytics.enabled,
    ANALYTICS_DB_HOST: config.analytics.host ?? "",
    ANALYTICS_DB_PORT: config.analytics.port ? String(config.analytics.port) : "",
    ANALYTICS_DB_NAME: config.analytics.name ?? "",
    ANALYTICS_DB_USER: config.analytics.user ?? "",
    ANALYTICS_DB_PASSWORD: config.analytics.password ?? "",
    ANALYTICS_DB_SSL: config.analytics.ssl,
    JWT_SECRET: config.security.jwtSecret,
    JWT_EXPIRES_IN_SECONDS: String(config.security.jwtExpiresInSeconds),
    AUTH_MAX_LOGIN_ATTEMPTS: String(config.security.authMaxLoginAttempts),
    AUTH_LOCKOUT_MINUTES: String(config.security.authLockoutMinutes),
    ADMIN_SESSION_IDLE_MINUTES: String(config.security.adminSessionIdleMinutes),
    ADMIN_ALLOWED_IPS: config.security.adminAllowedIps.join(", "),
    INTERNAL_API_ALLOWED_IPS: config.security.internalApiAllowedIps.join(", "),
    SECRET_ROTATION_DAYS: String(config.security.secretRotationDays),
    SECRETS_LAST_ROTATED_AT: config.security.secretsLastRotatedAt ?? "",
    SECRET_OWNER_EMAIL: config.security.secretOwnerEmail ?? "",
    OPERATIONS_OWNER_EMAIL: config.security.operationsOwnerEmail ?? "",
    AUTH_OTP_DEBUG: config.auth.otpDebug,
    AUTH_OTP_EXPIRY_MINUTES: String(config.auth.otpExpiryMinutes),
    SUPER_ADMIN_EMAILS: config.auth.superAdminEmails.join(", "),
    SMTP_HOST: config.notifications.email.host,
    SMTP_PORT: String(config.notifications.email.port),
    SMTP_SECURE: config.notifications.email.secure,
    SMTP_USER: config.notifications.email.user ?? "",
    SMTP_PASS: config.notifications.email.password ?? "",
    SMTP_FROM_EMAIL: config.notifications.email.fromEmail ?? "",
    SMTP_FROM_NAME: config.notifications.email.fromName,
    APP_LOG_LEVEL: config.observability.logLevel,
    OPS_ALERT_EMAILS: config.observability.alertEmails.join(", "),
    OPS_ALERT_WEBHOOK_URL: config.observability.alertWebhookUrl ?? "",
    ALERT_CHECKOUT_FAILURE_THRESHOLD: String(
      config.observability.thresholds.checkoutFailures
    ),
    ALERT_PAYMENT_VERIFY_FAILURE_THRESHOLD: String(
      config.observability.thresholds.paymentVerifyFailures
    ),
    ALERT_WEBHOOK_FAILURE_THRESHOLD: String(
      config.observability.thresholds.webhookFailures
    ),
    ALERT_ORDER_CREATION_FAILURE_THRESHOLD: String(
      config.observability.thresholds.orderCreationFailures
    ),
    ALERT_MAIL_FAILURE_THRESHOLD: String(config.observability.thresholds.mailFailures),
    ALERT_CONNECTOR_SYNC_FAILURE_THRESHOLD: String(
      config.observability.thresholds.connectorSyncFailures
    ),
    DB_BACKUP_ENABLED: config.operations.backups.enabled,
    DB_BACKUP_CADENCE_HOURS: String(config.operations.backups.cadenceHours),
    DB_BACKUP_RETENTION_DAYS: String(config.operations.backups.retentionDays),
    DB_BACKUP_MAX_FILES: String(config.operations.backups.maxBackups),
    DB_BACKUP_LAST_VERIFIED_AT: config.operations.backups.lastVerifiedAt ?? "",
    GDRIVE_BACKUP_ENABLED: config.operations.backups.googleDrive.enabled,
    GDRIVE_CLIENT_ID: config.operations.backups.googleDrive.clientId ?? "",
    GDRIVE_CLIENT_SECRET: config.operations.backups.googleDrive.clientSecret ?? "",
    GDRIVE_REFRESH_TOKEN: config.operations.backups.googleDrive.refreshToken ?? "",
    GDRIVE_FOLDER_ID: config.operations.backups.googleDrive.folderId ?? "",
    ADMIN_AUDIT_LOG_ENABLED: config.operations.audit.adminAuditEnabled,
    SUPPORT_EVENT_LOG_ENABLED: config.operations.audit.supportEventLoggingEnabled,
    SECURITY_CHECKLIST_LAST_REVIEWED_AT:
      config.operations.audit.securityChecklistLastReviewedAt ?? "",
    ECOMMERCE_FREE_SHIPPING_THRESHOLD: String(
      config.commerce.storefront.freeShippingThreshold
    ),
    ECOMMERCE_DEFAULT_SHIPPING_AMOUNT: String(
      config.commerce.storefront.defaultShippingAmount
    ),
    RAZORPAY_ENABLED: config.commerce.razorpay.enabled,
    RAZORPAY_KEY_ID: config.commerce.razorpay.keyId ?? "",
    RAZORPAY_KEY_SECRET: config.commerce.razorpay.keySecret ?? "",
    RAZORPAY_WEBHOOK_SECRET: config.commerce.razorpay.webhookSecret ?? "",
    BILLING_FINANCIAL_YEAR_START_MONTH: String(
      config.billing.compliance.financialYearStartMonth
    ),
    BILLING_FINANCIAL_YEAR_START_DAY: String(
      config.billing.compliance.financialYearStartDay
    ),
    BILLING_LOCK_DATE: config.billing.compliance.lockDate ?? "",
    BILLING_PERIOD_CLOSED_THROUGH: config.billing.compliance.periodClosedThrough ?? "",
    BILLING_DOCUMENT_NUMBERING_POLICY: config.billing.compliance.documentNumbering.policy,
    BILLING_REVIEW_ENABLED: config.billing.compliance.review.enabled,
    BILLING_REVIEW_THRESHOLD_AMOUNT: String(
      config.billing.compliance.review.amountThreshold
    ),
    BILLING_STOCK_VALUATION_METHOD: config.billing.compliance.stock.valuationMethod,
    BILLING_PREFIX_PAYMENT: config.billing.compliance.documentNumbering.prefixes.payment,
    BILLING_PREFIX_RECEIPT: config.billing.compliance.documentNumbering.prefixes.receipt,
    BILLING_PREFIX_SALES: config.billing.compliance.documentNumbering.prefixes.sales,
    BILLING_PREFIX_SALES_RETURN: config.billing.compliance.documentNumbering.prefixes.sales_return,
    BILLING_PREFIX_CREDIT_NOTE: config.billing.compliance.documentNumbering.prefixes.credit_note,
    BILLING_PREFIX_PURCHASE: config.billing.compliance.documentNumbering.prefixes.purchase,
    BILLING_PREFIX_PURCHASE_RETURN: config.billing.compliance.documentNumbering.prefixes.purchase_return,
    BILLING_PREFIX_DEBIT_NOTE: config.billing.compliance.documentNumbering.prefixes.debit_note,
    BILLING_PREFIX_STOCK_ADJUSTMENT:
      config.billing.compliance.documentNumbering.prefixes.stock_adjustment,
    BILLING_PREFIX_LANDED_COST:
      config.billing.compliance.documentNumbering.prefixes.landed_cost,
    BILLING_PREFIX_CONTRA: config.billing.compliance.documentNumbering.prefixes.contra,
    BILLING_PREFIX_JOURNAL: config.billing.compliance.documentNumbering.prefixes.journal,
    BILLING_EINVOICE_ENABLED: config.billing.compliance.eInvoice.enabled,
    BILLING_EINVOICE_MODE: config.billing.compliance.eInvoice.mode,
    BILLING_EINVOICE_BASE_URL: config.billing.compliance.eInvoice.baseUrl ?? "",
    BILLING_EINVOICE_USERNAME: config.billing.compliance.eInvoice.username ?? "",
    BILLING_EINVOICE_PASSWORD: config.billing.compliance.eInvoice.password ?? "",
    BILLING_EINVOICE_CLIENT_ID: config.billing.compliance.eInvoice.clientId ?? "",
    BILLING_EINVOICE_CLIENT_SECRET:
      config.billing.compliance.eInvoice.clientSecret ?? "",
    BILLING_EINVOICE_GSTIN: config.billing.compliance.eInvoice.gstin ?? "",
    BILLING_EWAYBILL_ENABLED: config.billing.compliance.eWayBill.enabled,
    BILLING_EWAYBILL_MODE: config.billing.compliance.eWayBill.mode,
    BILLING_EWAYBILL_BASE_URL: config.billing.compliance.eWayBill.baseUrl ?? "",
    BILLING_EWAYBILL_USERNAME: config.billing.compliance.eWayBill.username ?? "",
    BILLING_EWAYBILL_PASSWORD: config.billing.compliance.eWayBill.password ?? "",
    BILLING_EWAYBILL_CLIENT_ID: config.billing.compliance.eWayBill.clientId ?? "",
    BILLING_EWAYBILL_CLIENT_SECRET:
      config.billing.compliance.eWayBill.clientSecret ?? "",
    BILLING_EWAYBILL_GSTIN: config.billing.compliance.eWayBill.gstin ?? "",
  }

  return valueMap[field.key] ?? (field.type === "boolean" ? false : "")
}

function normalizeFieldValue(field: RuntimeSettingField, rawValue: unknown) {
  if (field.type === "boolean") {
    return typeof rawValue === "boolean" ? rawValue : toBooleanValue(toStringValue(rawValue))
  }

  const value = toStringValue(rawValue).trim()

  if (field.required && value.length === 0) {
    throw new ApplicationError(`${field.label} is required.`, { field: field.key }, 400)
  }

  if (field.type === "number" && value.length > 0) {
    const parsed = Number(value)

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new ApplicationError(
        `${field.label} must be a valid positive number.`,
        { field: field.key, value },
        400
      )
    }
  }

  if (field.type === "select" && value.length > 0) {
    const allowedValues = new Set((field.options ?? []).map((option) => option.value))

    if (!allowedValues.has(value)) {
      throw new ApplicationError(
        `${field.label} must use one of the allowed options.`,
        { field: field.key, value },
        400
      )
    }
  }

  return value
}

function toEnvString(field: RuntimeSettingField, value: string | boolean) {
  if (field.type === "boolean") {
    return value ? "true" : "false"
  }

  return String(value)
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

function buildEnvFileContent(
  values: Record<string, string | boolean>,
  existingUnknownValues: Record<string, string>
) {
  const sections = runtimeSettingGroups.map((group) => {
    const lines = [
      `# ${group.label}`,
      `# ${group.summary}`,
      ...group.fields.flatMap((field) => {
        const value = values[field.key] ?? (field.type === "boolean" ? false : "")
        const envValue = toEnvString(field, value)

        if (!field.required && envValue.length === 0) {
          return []
        }

        return [`${field.key}=${escapeEnvValue(envValue)}`]
      }),
    ]

    return lines.join("\n")
  })

  const unknownSectionEntries = Object.entries(existingUnknownValues)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${escapeEnvValue(value)}`)

  if (unknownSectionEntries.length > 0) {
    sections.push(
      ["# Additional", "# Existing unmanaged environment values.", ...unknownSectionEntries].join(
        "\n"
      )
    )
  }

  return `${sections.join("\n\n")}\n`
}

function resolveCurrentSettingValue(
  field: RuntimeSettingField,
  currentFileValues: Record<string, string>,
  cwd: string
) {
  return normalizeFieldValue(
    field,
    currentFileValues[field.key] ?? valueFromResolvedConfig(field, cwd)
  )
}

function requiresContainerRestartForSettingsChange(
  currentFileValues: Record<string, string>,
  normalizedValues: Record<string, string | boolean>,
  cwd: string
) {
  return runtimeSettingGroups.some((group) =>
    group.fields.some((field) => {
      if (!containerRestartSettingKeys.has(field.key)) {
        return false
      }

      const currentValue = resolveCurrentSettingValue(field, currentFileValues, cwd)
      const nextValue = normalizedValues[field.key] ?? (field.type === "boolean" ? false : "")

      return toEnvString(field, currentValue) !== toEnvString(field, nextValue)
    })
  )
}

export function getRuntimeSettingsSnapshot(cwd = process.cwd()): RuntimeSettingsSnapshot {
  const values = Object.fromEntries(
    runtimeSettingGroups.flatMap((group) =>
      group.fields.map((field) => [field.key, valueFromResolvedConfig(field, cwd)])
    )
  ) as Record<string, string | boolean>

  return runtimeSettingsSnapshotSchema.parse({
    envFilePath: envFilePath(cwd),
    values,
  })
}

export async function saveRuntimeSettings(
  payload: unknown,
  cwd = process.cwd()
): Promise<RuntimeSettingsSaveResponse> {
  const parsedPayload = runtimeSettingsSavePayloadSchema.parse(payload)
  const currentFileValues = parseEnvFile(envFilePath(cwd))
  const normalizedValues = Object.fromEntries(
    runtimeSettingGroups.flatMap((group) =>
      group.fields.map((field) => [
        field.key,
        normalizeFieldValue(
          field,
          parsedPayload.values[field.key] ?? valueFromResolvedConfig(field, cwd)
        ),
      ])
    )
  ) as Record<string, string | boolean>

  const unknownValues = Object.fromEntries(
    Object.entries(currentFileValues).filter(([key]) => !runtimeSettingKeys.includes(key))
  )

  writeFileSync(
    envFilePath(cwd),
    buildEnvFileContent(normalizedValues, unknownValues),
    "utf8"
  )

  let restartScheduled = false

  if (parsedPayload.restart) {
    const config = getServerConfig(cwd)
    const requiresContainerRestart = requiresContainerRestartForSettingsChange(
      currentFileValues,
      normalizedValues,
      cwd
    )

    restartScheduled =
      config.environment === "development" && !requiresContainerRestart
        ? triggerDevelopmentRestart(cwd)
        : false

    if (!restartScheduled) {
      restartScheduled = true
      scheduleFallbackRestart()
    }
  }

  return runtimeSettingsSaveResponseSchema.parse({
    saved: true,
    restartScheduled,
    snapshot: getRuntimeSettingsSnapshot(cwd),
  })
}
