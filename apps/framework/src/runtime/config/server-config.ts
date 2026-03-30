import path from "node:path"

import { readBoolean, readNumber, resolveEnv } from "./env.js"

export type DatabaseDriver = "mariadb" | "postgres" | "sqlite"

export type ServerConfig = {
  appName: string
  appHost: string
  appDomain: string
  appHttpPort: number
  appHttpsPort: number
  frontendDomain: string
  frontendHost: string
  frontendHttpPort: number
  frontendHttpsPort: number
  webRoot: string
  tlsEnabled: boolean
  tlsKeyPath?: string
  tlsCertPath?: string
  cloudflareEnabled: boolean
  database: {
    driver: DatabaseDriver
    host?: string
    port?: number
    name?: string
    user?: string
    password?: string
    ssl: boolean
    sqliteFile: string
  }
  offline: {
    enabled: boolean
    sqliteFile: string
  }
  analytics: {
    enabled: boolean
    driver: "postgres"
    host?: string
    port?: number
    name?: string
    user?: string
    password?: string
    ssl: boolean
  }
  security: {
    jwtSecret: string
    jwtExpiresInSeconds: number
  }
  auth: {
    otpDebug: boolean
    otpExpiryMinutes: number
    superAdminEmails: string[]
  }
  notifications: {
    email: {
      enabled: boolean
      host: string
      port: number
      secure: boolean
      user?: string
      password?: string
      fromEmail?: string
      fromName: string
    }
  }
}

export function getServerConfig(cwd = process.cwd()): ServerConfig {
  const env = resolveEnv(cwd)
  const tlsEnabled = readBoolean(env.TLS_ENABLED, false)
  const sqliteFile = path.resolve(cwd, env.SQLITE_FILE ?? "storage/desktop/codexsun.sqlite")
  const analyticsEnabled = readBoolean(env.ANALYTICS_DB_ENABLED, false)
  const superAdminEmails = Array.from(
    new Set(
      (env.SUPER_ADMIN_EMAILS ?? "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    )
  )
  const smtpUser = env.SMTP_USER?.trim() || undefined
  const smtpPassword = env.SMTP_PASS?.trim() || undefined
  const smtpFromEmail = env.SMTP_FROM_EMAIL?.trim() || undefined

  return {
    appName: env.APP_NAME ?? "codexsun",
    appHost: env.APP_HOST ?? "0.0.0.0",
    appDomain: env.APP_DOMAIN ?? "api.codexsun.local",
    appHttpPort: readNumber(env.APP_HTTP_PORT ?? env.APP_PORT, 3000, "APP_HTTP_PORT"),
    appHttpsPort: readNumber(env.APP_HTTPS_PORT, 3443, "APP_HTTPS_PORT"),
    frontendDomain: env.FRONTEND_DOMAIN ?? "app.codexsun.local",
    frontendHost: env.FRONTEND_HOST ?? "0.0.0.0",
    frontendHttpPort: readNumber(env.FRONTEND_HTTP_PORT, 5173, "FRONTEND_HTTP_PORT"),
    frontendHttpsPort: readNumber(env.FRONTEND_HTTPS_PORT, 5174, "FRONTEND_HTTPS_PORT"),
    webRoot: path.resolve(cwd, env.WEB_ROOT ?? "build/app/cxapp/web"),
    tlsEnabled,
    tlsKeyPath: env.TLS_KEY_PATH
      ? path.resolve(cwd, env.TLS_KEY_PATH)
      : undefined,
    tlsCertPath: env.TLS_CERT_PATH
      ? path.resolve(cwd, env.TLS_CERT_PATH)
      : undefined,
    cloudflareEnabled: readBoolean(env.CLOUDFLARE_ENABLED, false),
    database: {
      driver: (env.DB_DRIVER as DatabaseDriver | undefined) ?? "mariadb",
      host: env.DB_HOST,
      port: env.DB_PORT ? readNumber(env.DB_PORT, 3306, "DB_PORT") : undefined,
      name: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: readBoolean(env.DB_SSL, false),
      sqliteFile,
    },
    offline: {
      enabled: readBoolean(env.OFFLINE_SUPPORT_ENABLED, false),
      sqliteFile,
    },
    analytics: {
      enabled: analyticsEnabled,
      driver: "postgres",
      host: env.ANALYTICS_DB_HOST,
      port: env.ANALYTICS_DB_PORT
        ? readNumber(env.ANALYTICS_DB_PORT, 5432, "ANALYTICS_DB_PORT")
        : undefined,
      name: env.ANALYTICS_DB_NAME,
      user: env.ANALYTICS_DB_USER,
      password: env.ANALYTICS_DB_PASSWORD,
      ssl: readBoolean(env.ANALYTICS_DB_SSL, false),
    },
    security: {
      jwtSecret:
        env.JWT_SECRET?.trim() && env.JWT_SECRET.trim().length >= 16
          ? env.JWT_SECRET.trim()
          : "codexsun-development-jwt-secret",
      jwtExpiresInSeconds: readNumber(
        env.JWT_EXPIRES_IN_SECONDS,
        28_800,
        "JWT_EXPIRES_IN_SECONDS"
      ),
    },
    auth: {
      otpDebug: readBoolean(env.AUTH_OTP_DEBUG, true),
      otpExpiryMinutes: readNumber(
        env.AUTH_OTP_EXPIRY_MINUTES,
        10,
        "AUTH_OTP_EXPIRY_MINUTES"
      ),
      superAdminEmails,
    },
    notifications: {
      email: {
        enabled: Boolean(smtpUser && smtpPassword && smtpFromEmail),
        host: env.SMTP_HOST?.trim() || "smtp.gmail.com",
        port: readNumber(env.SMTP_PORT, 465, "SMTP_PORT"),
        secure: readBoolean(env.SMTP_SECURE, true),
        user: smtpUser,
        password: smtpPassword,
        fromEmail: smtpFromEmail,
        fromName: env.SMTP_FROM_NAME?.trim() || "codexsun",
      },
    },
  }
}
