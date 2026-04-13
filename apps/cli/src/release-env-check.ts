import { pathToFileURL } from "node:url"

import { getServerConfig } from "../../framework/src/runtime/config/index.js"

type CheckSeverity = "blocker" | "warning" | "pass"

type CheckResult = {
  key: string
  severity: CheckSeverity
  message: string
}

type ReleaseEnvReport = {
  environment: string
  summary: {
    blockerCount: number
    warningCount: number
    passCount: number
  }
  checks: CheckResult[]
}

function createPass(key: string, message: string): CheckResult {
  return { key, severity: "pass", message }
}

function createWarning(key: string, message: string): CheckResult {
  return { key, severity: "warning", message }
}

function createBlocker(key: string, message: string): CheckResult {
  return { key, severity: "blocker", message }
}

function isLocalDomain(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return (
    normalized.endsWith(".local") ||
    normalized === "localhost" ||
    normalized.endsWith(".localhost")
  )
}

export function buildReleaseEnvReport(cwd = process.cwd()): ReleaseEnvReport {
  const config = getServerConfig(cwd)
  const checks: CheckResult[] = []

  if (config.environment === "production" || config.environment === "staging") {
    checks.push(
      createPass("environment", `Runtime environment is ${config.environment}.`)
    )
  } else {
    checks.push(
      createBlocker(
        "environment",
        `Runtime environment is ${config.environment}; release env signoff requires staging or production.`
      )
    )
  }

  if (config.tlsEnabled) {
    checks.push(createPass("tls", "TLS is enabled for the application runtime."))
  } else {
    checks.push(createBlocker("tls", "TLS is disabled."))
  }

  if (isLocalDomain(config.appDomain) || isLocalDomain(config.frontendDomain)) {
    checks.push(
      createBlocker(
        "domains",
        `App/frontend domains are still local (${config.appDomain}, ${config.frontendDomain}).`
      )
    )
  } else {
    checks.push(
      createPass(
        "domains",
        `App/frontend domains are set to ${config.appDomain} and ${config.frontendDomain}.`
      )
    )
  }

  if (config.database.driver === "mariadb") {
    checks.push(createPass("database", "Primary database driver is mariadb."))
  } else {
    checks.push(
      createBlocker(
        "database",
        `Primary database driver is ${config.database.driver}; production baseline expects mariadb.`
      )
    )
  }

  if (config.security.secretOwnerEmail?.trim()) {
    checks.push(createPass("secret-owner", "Secret owner email is configured."))
  } else {
    checks.push(createBlocker("secret-owner", "SECRET_OWNER_EMAIL is missing."))
  }

  if (config.security.operationsOwnerEmail?.trim()) {
    checks.push(createPass("operations-owner", "Operations owner email is configured."))
  } else {
    checks.push(createBlocker("operations-owner", "OPERATIONS_OWNER_EMAIL is missing."))
  }

  if (config.security.secretsLastRotatedAt?.trim()) {
    checks.push(createPass("rotation-date", "Secret rotation evidence is recorded."))
  } else {
    checks.push(
      createBlocker("rotation-date", "SECRETS_LAST_ROTATED_AT is missing.")
    )
  }

  if (
    config.notifications.email.user?.trim() &&
    config.notifications.email.password?.trim() &&
    config.notifications.email.fromEmail?.trim()
  ) {
    checks.push(createPass("smtp", "SMTP credentials and sender are configured."))
  } else {
    checks.push(
      createBlocker("smtp", "SMTP credentials or sender identity are incomplete.")
    )
  }

  if (
    config.commerce.razorpay.enabled &&
    config.commerce.razorpay.keyId?.trim() &&
    config.commerce.razorpay.keySecret?.trim() &&
    config.commerce.razorpay.webhookSecret?.trim()
  ) {
    checks.push(
      createPass("razorpay", "Razorpay live credentials and webhook secret are configured.")
    )
  } else {
    checks.push(
      createBlocker(
        "razorpay",
        "Razorpay enablement, live key pair, or webhook secret is incomplete."
      )
    )
  }

  if (config.operations.backups.enabled) {
    checks.push(createPass("backup", "Database backups are enabled."))
  } else {
    checks.push(createBlocker("backup", "Database backups are disabled."))
  }

  if (config.operations.serverMonitorSharedSecret?.trim()) {
    checks.push(
      createPass(
        "server-monitor-secret",
        "Remote server monitoring shared secret is configured."
      )
    )
  } else {
    checks.push(
      createBlocker(
        "server-monitor-secret",
        "SERVER_MONITOR_SHARED_SECRET is missing."
      )
    )
  }

  if (config.operations.backups.googleDrive.enabled) {
    if (
      config.operations.backups.googleDrive.clientId?.trim() &&
      config.operations.backups.googleDrive.clientSecret?.trim() &&
      config.operations.backups.googleDrive.refreshToken?.trim() &&
      config.operations.backups.googleDrive.folderId?.trim()
    ) {
      checks.push(
        createPass(
          "backup-destination",
          "Off-machine Google Drive backup destination is configured."
        )
      )
    } else {
      checks.push(
        createBlocker(
          "backup-destination",
          "Google Drive backup is enabled but credentials or folder id are incomplete."
        )
      )
    }
  } else {
    checks.push(
      createBlocker(
        "backup-destination",
        "Off-machine backup destination is disabled; set GDRIVE_BACKUP_ENABLED and credentials."
      )
    )
  }

  if (
    config.observability.alertEmails.length > 0 ||
    Boolean(config.observability.alertWebhookUrl)
  ) {
    checks.push(createPass("alerts", "Alert delivery target is configured."))
  } else {
    checks.push(
      createBlocker("alerts", "OPS_ALERT_EMAILS and OPS_ALERT_WEBHOOK_URL are both empty.")
    )
  }

  if (config.security.adminAllowedIps.length > 0) {
    checks.push(createPass("admin-allowlist", "Admin IP allowlist is configured."))
  } else {
    checks.push(
      createWarning(
        "admin-allowlist",
        "ADMIN_ALLOWED_IPS is empty; admin access is not IP-restricted."
      )
    )
  }

  if (config.security.internalApiAllowedIps.length > 0) {
    checks.push(
      createPass("internal-api-allowlist", "Internal API allowlist is configured.")
    )
  } else {
    checks.push(
      createWarning(
        "internal-api-allowlist",
        "INTERNAL_API_ALLOWED_IPS is empty; internal routes rely on auth only."
      )
    )
  }

  const blockerCount = checks.filter((item) => item.severity === "blocker").length
  const warningCount = checks.filter((item) => item.severity === "warning").length
  const passCount = checks.filter((item) => item.severity === "pass").length

  return {
    environment: config.environment,
    summary: {
      blockerCount,
      warningCount,
      passCount,
    },
    checks,
  }
}

function printReport(report: ReleaseEnvReport) {
  console.info(`Release env check for ${report.environment}`)
  console.info(
    `Checks: ${report.summary.passCount} pass, ${report.summary.warningCount} warning, ${report.summary.blockerCount} blocker`
  )

  for (const item of report.checks) {
    const prefix =
      item.severity === "pass"
        ? "[pass]"
        : item.severity === "warning"
          ? "[warn]"
          : "[blocker]"
    console.info(`${prefix} ${item.key}: ${item.message}`)
  }
}

export async function runReleaseEnvCheck(cwd = process.cwd()): Promise<number> {
  const report = buildReleaseEnvReport(cwd)
  printReport(report)

  if (report.summary.blockerCount > 0) {
    console.error("Release environment checklist failed.")
    return 1
  }

  console.info("Release environment checklist passed.")
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const exitCode = await runReleaseEnvCheck()
  process.exit(exitCode)
}
