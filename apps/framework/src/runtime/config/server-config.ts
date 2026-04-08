import path from "node:path"

import { readBoolean, readNumber, resolveEnv } from "./env.js"

export type DatabaseDriver = "mariadb" | "postgres" | "sqlite"
export type RuntimeEnvironment = "development" | "staging" | "production"
export type FrontendTarget = "site" | "shop" | "app"
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
export type ToastTone = "soft" | "solid"
export type LogLevel = "debug" | "info" | "warn" | "error"

function readFrontendTarget(value: string | undefined): FrontendTarget {
  if (value === "site" || value === "shop" || value === "app") {
    return value
  }

  return "site"
}

function readToastPosition(value: string | undefined): ToastPosition {
  switch (value) {
    case "top-left":
    case "top-center":
    case "top-right":
    case "bottom-left":
    case "bottom-center":
    case "bottom-right":
      return value
    default:
      return "top-right"
  }
}

function readToastTone(value: string | undefined): ToastTone {
  return value === "solid" ? "solid" : "soft"
}

function readLogLevel(value: string | undefined): LogLevel {
  const normalizedValue = (value ?? "").trim().toLowerCase()

  switch (normalizedValue) {
    case "debug":
    case "warn":
    case "error":
      return normalizedValue as LogLevel
    default:
      return "info"
  }
}

function readRuntimeEnvironment(value: string | undefined): RuntimeEnvironment {
  switch ((value ?? "").trim().toLowerCase()) {
    case "production":
      return "production"
    case "staging":
      return "staging"
    default:
      return "development"
  }
}

function readStringList(value: string | undefined) {
  return Array.from(
    new Set(
      (value ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  )
}

export type ServerConfig = {
  environment: RuntimeEnvironment
  appName: string
  appHost: string
  appDomain: string
  appHttpPort: number
  appHttpsPort: number
  frontendDomain: string
  frontendHost: string
  frontendHttpPort: number
  frontendHttpsPort: number
  frontendTarget: FrontendTarget
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
    httpsOnly: boolean
    jwtSecret: string
    jwtExpiresInSeconds: number
    authMaxLoginAttempts: number
    authLockoutMinutes: number
    adminSessionIdleMinutes: number
    adminAllowedIps: string[]
    internalApiAllowedIps: string[]
    secretRotationDays: number
    secretsLastRotatedAt?: string
    secretOwnerEmail?: string
    operationsOwnerEmail?: string
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
    toast: {
      position: ToastPosition
      tone: ToastTone
    }
  }
  observability: {
    logLevel: LogLevel
    alertEmails: string[]
    alertWebhookUrl?: string
    thresholds: {
      checkoutFailures: number
      paymentVerifyFailures: number
      webhookFailures: number
      orderCreationFailures: number
      mailFailures: number
      connectorSyncFailures: number
    }
  }
  operations: {
    backups: {
      enabled: boolean
      cadenceHours: number
      retentionDays: number
      maxBackups: number
      lastVerifiedAt?: string
      googleDrive: {
        enabled: boolean
        clientId?: string
        clientSecret?: string
        refreshToken?: string
        folderId?: string
      }
    }
    audit: {
      adminAuditEnabled: boolean
      supportEventLoggingEnabled: boolean
      securityChecklistLastReviewedAt?: string
    }
  }
  billing: {
    compliance: {
      financialYearStartMonth: number
      financialYearStartDay: number
      lockDate?: string
      periodClosedThrough?: string
      documentNumbering: {
        policy: "auto" | "hybrid" | "manual"
        prefixes: Record<
          | "payment"
          | "receipt"
          | "sales"
          | "sales_return"
          | "credit_note"
          | "purchase"
          | "purchase_return"
          | "debit_note"
          | "stock_adjustment"
          | "landed_cost"
          | "contra"
          | "journal",
          string
        >
      }
      review: {
        enabled: boolean
        amountThreshold: number
      }
      stock: {
        valuationMethod: "weighted_average" | "moving_average" | "fifo"
      }
      eInvoice: {
        enabled: boolean
        mode: "manual" | "live"
        baseUrl?: string
        username?: string
        password?: string
        clientId?: string
        clientSecret?: string
        gstin?: string
      }
      eWayBill: {
        enabled: boolean
        mode: "manual" | "live"
        baseUrl?: string
        username?: string
        password?: string
        clientId?: string
        clientSecret?: string
        gstin?: string
      }
    }
  }
  commerce: {
    storefront: {
      freeShippingThreshold: number
      defaultShippingAmount: number
    }
    razorpay: {
      enabled: boolean
      keyId?: string
      keySecret?: string
      webhookSecret?: string
      businessName: string
      checkoutImage?: string
      themeColor?: string
    }
  }
}

function validateServerConfig(config: ServerConfig) {
  if (config.environment === "development") {
    return config
  }

  if (!config.tlsEnabled && !config.cloudflareEnabled) {
    throw new Error(
      "Production-like environments must enable TLS directly or run behind Cloudflare."
    )
  }

  if (
    !config.appDomain.trim() ||
    !config.frontendDomain.trim() ||
    /(^|\.)local$/i.test(config.appDomain) ||
    /(^|\.)local$/i.test(config.frontendDomain) ||
    /localhost/i.test(config.appDomain) ||
    /localhost/i.test(config.frontendDomain)
  ) {
    throw new Error(
      "Production-like environments must use real app and frontend domains."
    )
  }

  if (config.security.jwtSecret === "codexsun-development-jwt-secret") {
    throw new Error(
      "Production-like environments must configure a non-default JWT secret."
    )
  }

  if (config.auth.otpDebug) {
    throw new Error(
      "Production-like environments must disable AUTH_OTP_DEBUG."
    )
  }

  if (config.tlsEnabled && (!config.tlsKeyPath || !config.tlsCertPath)) {
    throw new Error(
      "TLS-enabled production-like environments must define TLS key and certificate paths."
    )
  }

  if (!config.security.secretOwnerEmail?.trim()) {
    throw new Error(
      "Production-like environments must define SECRET_OWNER_EMAIL."
    )
  }

  if (!config.security.operationsOwnerEmail?.trim()) {
    throw new Error(
      "Production-like environments must define OPERATIONS_OWNER_EMAIL."
    )
  }

  if (!config.security.secretsLastRotatedAt?.trim()) {
    throw new Error(
      "Production-like environments must define SECRETS_LAST_ROTATED_AT."
    )
  }

  return config
}

export function getServerConfig(cwd = process.cwd()): ServerConfig {
  const env = resolveEnv(cwd)
  const environment = readRuntimeEnvironment(env.APP_ENV ?? env.NODE_ENV)
  const tlsEnabled = readBoolean(env.TLS_ENABLED, false)
  const razorpayKeyId = env.RAZORPAY_KEY_ID?.trim() || undefined
  const razorpayKeySecret = env.RAZORPAY_KEY_SECRET?.trim() || undefined
  const razorpayWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET?.trim() || undefined
  const legacyPaymentTest = readBoolean(env.PAYMENT_TEST, false)
  const razorpayEnabled =
    env.RAZORPAY_ENABLED != null
      ? readBoolean(env.RAZORPAY_ENABLED, false)
      : Boolean(razorpayKeyId && razorpayKeySecret && !legacyPaymentTest)
  const sqliteFile = path.resolve(cwd, env.SQLITE_FILE ?? "storage/desktop/codexsun.sqlite")
  const analyticsEnabled = readBoolean(env.ANALYTICS_DB_ENABLED, false)
  const superAdminEmails = readStringList(env.SUPER_ADMIN_EMAILS).map((entry) =>
    entry.toLowerCase()
  )
  const smtpUser = env.SMTP_USER?.trim() || undefined
  const smtpPassword = env.SMTP_PASS?.trim() || undefined
  const smtpFromEmail = env.SMTP_FROM_EMAIL?.trim() || undefined

  return validateServerConfig({
    environment,
    appName: env.APP_NAME ?? "codexsun",
    appHost: env.APP_HOST ?? "0.0.0.0",
    appDomain: env.APP_DOMAIN ?? "api.codexsun.local",
    appHttpPort: readNumber(env.APP_HTTP_PORT ?? env.APP_PORT, 3000, "APP_HTTP_PORT"),
    appHttpsPort: readNumber(env.APP_HTTPS_PORT, 3443, "APP_HTTPS_PORT"),
    frontendDomain: env.FRONTEND_DOMAIN ?? "app.codexsun.local",
    frontendHost: env.FRONTEND_HOST ?? "0.0.0.0",
    frontendHttpPort: readNumber(env.FRONTEND_HTTP_PORT, 5173, "FRONTEND_HTTP_PORT"),
    frontendHttpsPort: readNumber(env.FRONTEND_HTTPS_PORT, 5174, "FRONTEND_HTTPS_PORT"),
    frontendTarget: readFrontendTarget(env.VITE_FRONTEND_TARGET),
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
      httpsOnly: environment !== "development",
      jwtSecret:
        env.JWT_SECRET?.trim() && env.JWT_SECRET.trim().length >= 16
          ? env.JWT_SECRET.trim()
          : "codexsun-development-jwt-secret",
      jwtExpiresInSeconds: readNumber(
        env.JWT_EXPIRES_IN_SECONDS,
        28_800,
        "JWT_EXPIRES_IN_SECONDS"
      ),
      authMaxLoginAttempts: readNumber(
        env.AUTH_MAX_LOGIN_ATTEMPTS,
        5,
        "AUTH_MAX_LOGIN_ATTEMPTS"
      ),
      authLockoutMinutes: readNumber(
        env.AUTH_LOCKOUT_MINUTES,
        30,
        "AUTH_LOCKOUT_MINUTES"
      ),
      adminSessionIdleMinutes: readNumber(
        env.ADMIN_SESSION_IDLE_MINUTES,
        30,
        "ADMIN_SESSION_IDLE_MINUTES"
      ),
      adminAllowedIps: readStringList(env.ADMIN_ALLOWED_IPS),
      internalApiAllowedIps: readStringList(env.INTERNAL_API_ALLOWED_IPS),
      secretRotationDays: readNumber(
        env.SECRET_ROTATION_DAYS,
        90,
        "SECRET_ROTATION_DAYS"
      ),
      secretsLastRotatedAt: env.SECRETS_LAST_ROTATED_AT?.trim() || undefined,
      secretOwnerEmail: env.SECRET_OWNER_EMAIL?.trim() || undefined,
      operationsOwnerEmail: env.OPERATIONS_OWNER_EMAIL?.trim() || undefined,
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
      toast: {
        position: readToastPosition(env.VITE_TOAST_POSITION),
        tone: readToastTone(env.VITE_TOAST_TONE),
      },
    },
    observability: {
      logLevel: readLogLevel(env.APP_LOG_LEVEL),
      alertEmails: readStringList(env.OPS_ALERT_EMAILS),
      alertWebhookUrl: env.OPS_ALERT_WEBHOOK_URL?.trim() || undefined,
      thresholds: {
        checkoutFailures: readNumber(
          env.ALERT_CHECKOUT_FAILURE_THRESHOLD,
          5,
          "ALERT_CHECKOUT_FAILURE_THRESHOLD"
        ),
        paymentVerifyFailures: readNumber(
          env.ALERT_PAYMENT_VERIFY_FAILURE_THRESHOLD,
          3,
          "ALERT_PAYMENT_VERIFY_FAILURE_THRESHOLD"
        ),
        webhookFailures: readNumber(
          env.ALERT_WEBHOOK_FAILURE_THRESHOLD,
          3,
          "ALERT_WEBHOOK_FAILURE_THRESHOLD"
        ),
        orderCreationFailures: readNumber(
          env.ALERT_ORDER_CREATION_FAILURE_THRESHOLD,
          5,
          "ALERT_ORDER_CREATION_FAILURE_THRESHOLD"
        ),
        mailFailures: readNumber(
          env.ALERT_MAIL_FAILURE_THRESHOLD,
          10,
          "ALERT_MAIL_FAILURE_THRESHOLD"
        ),
        connectorSyncFailures: readNumber(
          env.ALERT_CONNECTOR_SYNC_FAILURE_THRESHOLD,
          3,
          "ALERT_CONNECTOR_SYNC_FAILURE_THRESHOLD"
        ),
      },
    },
    operations: {
      backups: {
        enabled: readBoolean(env.DB_BACKUP_ENABLED, true),
        cadenceHours: readNumber(
          env.DB_BACKUP_CADENCE_HOURS,
          24,
          "DB_BACKUP_CADENCE_HOURS"
        ),
        retentionDays: readNumber(
          env.DB_BACKUP_RETENTION_DAYS,
          14,
          "DB_BACKUP_RETENTION_DAYS"
        ),
        maxBackups: readNumber(
          env.DB_BACKUP_MAX_FILES,
          5,
          "DB_BACKUP_MAX_FILES"
        ),
        lastVerifiedAt: env.DB_BACKUP_LAST_VERIFIED_AT?.trim() || undefined,
        googleDrive: {
          enabled: readBoolean(env.GDRIVE_BACKUP_ENABLED, false),
          clientId: env.GDRIVE_CLIENT_ID?.trim() || undefined,
          clientSecret: env.GDRIVE_CLIENT_SECRET?.trim() || undefined,
          refreshToken: env.GDRIVE_REFRESH_TOKEN?.trim() || undefined,
          folderId: env.GDRIVE_FOLDER_ID?.trim() || undefined,
        },
      },
      audit: {
        adminAuditEnabled: readBoolean(env.ADMIN_AUDIT_LOG_ENABLED, true),
        supportEventLoggingEnabled: readBoolean(env.SUPPORT_EVENT_LOG_ENABLED, true),
        securityChecklistLastReviewedAt:
          env.SECURITY_CHECKLIST_LAST_REVIEWED_AT?.trim() || undefined,
      },
    },
    billing: {
      compliance: {
        financialYearStartMonth: readNumber(
          env.BILLING_FINANCIAL_YEAR_START_MONTH,
          4,
          "BILLING_FINANCIAL_YEAR_START_MONTH"
        ),
        financialYearStartDay: readNumber(
          env.BILLING_FINANCIAL_YEAR_START_DAY,
          1,
          "BILLING_FINANCIAL_YEAR_START_DAY"
        ),
        lockDate: env.BILLING_LOCK_DATE?.trim() || undefined,
        periodClosedThrough: env.BILLING_PERIOD_CLOSED_THROUGH?.trim() || undefined,
        documentNumbering: {
          policy:
            (env.BILLING_DOCUMENT_NUMBERING_POLICY as "auto" | "hybrid" | "manual" | undefined) ??
            "hybrid",
          prefixes: {
            payment: env.BILLING_PREFIX_PAYMENT?.trim() || "PAY",
            receipt: env.BILLING_PREFIX_RECEIPT?.trim() || "RCP",
            sales: env.BILLING_PREFIX_SALES?.trim() || "SAL",
            sales_return: env.BILLING_PREFIX_SALES_RETURN?.trim() || "SRT",
            credit_note: env.BILLING_PREFIX_CREDIT_NOTE?.trim() || "CRN",
            purchase: env.BILLING_PREFIX_PURCHASE?.trim() || "PUR",
            purchase_return: env.BILLING_PREFIX_PURCHASE_RETURN?.trim() || "PRT",
            debit_note: env.BILLING_PREFIX_DEBIT_NOTE?.trim() || "DBN",
            stock_adjustment: env.BILLING_PREFIX_STOCK_ADJUSTMENT?.trim() || "STA",
            landed_cost: env.BILLING_PREFIX_LANDED_COST?.trim() || "LCT",
            contra: env.BILLING_PREFIX_CONTRA?.trim() || "CON",
            journal: env.BILLING_PREFIX_JOURNAL?.trim() || "JRN",
          },
        },
        review: {
          enabled: readBoolean(env.BILLING_REVIEW_ENABLED, true),
          amountThreshold: readNumber(
            env.BILLING_REVIEW_THRESHOLD_AMOUNT,
            50000,
            "BILLING_REVIEW_THRESHOLD_AMOUNT"
          ),
        },
        stock: {
          valuationMethod:
            (env.BILLING_STOCK_VALUATION_METHOD as
              | "weighted_average"
              | "moving_average"
              | "fifo"
              | undefined) ?? "weighted_average",
        },
        eInvoice: {
          enabled: readBoolean(env.BILLING_EINVOICE_ENABLED, false),
          mode: (env.BILLING_EINVOICE_MODE as "manual" | "live" | undefined) ?? "manual",
          baseUrl: env.BILLING_EINVOICE_BASE_URL?.trim() || undefined,
          username: env.BILLING_EINVOICE_USERNAME?.trim() || undefined,
          password: env.BILLING_EINVOICE_PASSWORD?.trim() || undefined,
          clientId: env.BILLING_EINVOICE_CLIENT_ID?.trim() || undefined,
          clientSecret: env.BILLING_EINVOICE_CLIENT_SECRET?.trim() || undefined,
          gstin: env.BILLING_EINVOICE_GSTIN?.trim() || undefined,
        },
        eWayBill: {
          enabled: readBoolean(env.BILLING_EWAYBILL_ENABLED, false),
          mode: (env.BILLING_EWAYBILL_MODE as "manual" | "live" | undefined) ?? "manual",
          baseUrl: env.BILLING_EWAYBILL_BASE_URL?.trim() || undefined,
          username: env.BILLING_EWAYBILL_USERNAME?.trim() || undefined,
          password: env.BILLING_EWAYBILL_PASSWORD?.trim() || undefined,
          clientId: env.BILLING_EWAYBILL_CLIENT_ID?.trim() || undefined,
          clientSecret: env.BILLING_EWAYBILL_CLIENT_SECRET?.trim() || undefined,
          gstin: env.BILLING_EWAYBILL_GSTIN?.trim() || undefined,
        },
      },
    },
    commerce: {
      storefront: {
        freeShippingThreshold: readNumber(
          env.ECOMMERCE_FREE_SHIPPING_THRESHOLD,
          3999,
          "ECOMMERCE_FREE_SHIPPING_THRESHOLD"
        ),
        defaultShippingAmount: readNumber(
          env.ECOMMERCE_DEFAULT_SHIPPING_AMOUNT,
          149,
          "ECOMMERCE_DEFAULT_SHIPPING_AMOUNT"
        ),
      },
      razorpay: {
        enabled: razorpayEnabled,
        keyId: razorpayKeyId,
        keySecret: razorpayKeySecret,
        webhookSecret: razorpayWebhookSecret,
        businessName: env.RAZORPAY_BUSINESS_NAME?.trim() || "Tirupur Direct",
        checkoutImage: env.RAZORPAY_CHECKOUT_IMAGE?.trim() || undefined,
        themeColor: env.RAZORPAY_THEME_COLOR?.trim() || undefined,
      },
    },
  })
}
