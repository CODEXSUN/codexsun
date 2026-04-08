import { z } from "zod"

export const runtimeSettingFieldTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "password",
  "select",
])

export const runtimeSettingOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})

export const runtimeSettingFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: runtimeSettingFieldTypeSchema,
  description: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(runtimeSettingOptionSchema).optional(),
})

export const runtimeToastPositionSchema = z.enum([
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
])

export const runtimeToastToneSchema = z.enum(["soft", "solid"])
export const runtimeEnvironmentSchema = z.enum([
  "development",
  "staging",
  "production",
])

export const runtimeSettingGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
  fields: z.array(runtimeSettingFieldSchema).min(1),
})

export type RuntimeSettingFieldType = z.infer<typeof runtimeSettingFieldTypeSchema>
export type RuntimeSettingOption = z.infer<typeof runtimeSettingOptionSchema>
export type RuntimeSettingFieldDefinition = {
  key: string
  label: string
  type: RuntimeSettingFieldType
  description: string
  placeholder?: string
  required?: boolean
  options?: readonly RuntimeSettingOption[]
}
export type RuntimeSettingGroupDefinition = {
  id: string
  label: string
  summary: string
  fields: readonly RuntimeSettingFieldDefinition[]
}

export const runtimeSettingValueSchema = z.union([z.string(), z.boolean()])

export const runtimeSettingsSnapshotSchema = z.object({
  envFilePath: z.string().min(1),
  values: z.record(z.string(), runtimeSettingValueSchema),
})

export const runtimeSettingsSavePayloadSchema = z.object({
  values: z.record(z.string(), runtimeSettingValueSchema),
  restart: z.boolean().optional().default(false),
})

export const runtimeSettingsSaveResponseSchema = z.object({
  saved: z.boolean(),
  restartScheduled: z.boolean(),
  snapshot: runtimeSettingsSnapshotSchema,
})

export const runtimeSettingGroups: readonly RuntimeSettingGroupDefinition[] = [
  {
    id: "application",
    label: "Application",
    summary: "Core host identity, listening endpoints, TLS, and filesystem roots.",
    fields: [
      {
        key: "APP_ENV",
        label: "App Environment",
        type: "select",
        description: "Runtime environment that controls production-safe enforcement.",
        required: true,
        options: [
          { label: "Development", value: "development" },
          { label: "Staging", value: "staging" },
          { label: "Production", value: "production" },
        ],
      },
      {
        key: "APP_NAME",
        label: "App Name",
        type: "string",
        description: "Primary application name used by the runtime shell.",
        placeholder: "codexsun",
        required: true,
      },
      {
        key: "APP_HOST",
        label: "App Host",
        type: "string",
        description: "Host binding for the backend server.",
        placeholder: "0.0.0.0",
        required: true,
      },
      {
        key: "APP_DOMAIN",
        label: "App Domain",
        type: "string",
        description: "Canonical backend domain used in shared links.",
        placeholder: "api.codexsun.local",
        required: true,
      },
      {
        key: "APP_HTTP_PORT",
        label: "HTTP Port",
        type: "number",
        description: "Primary backend HTTP port.",
        placeholder: "3000",
        required: true,
      },
      {
        key: "APP_HTTPS_PORT",
        label: "HTTPS Port",
        type: "number",
        description: "Primary backend HTTPS port when TLS is enabled.",
        placeholder: "3443",
        required: true,
      },
      {
        key: "WEB_ROOT",
        label: "Web Root",
        type: "string",
        description: "Static web root served by the backend host.",
        placeholder: "build/app/cxapp/web",
        required: true,
      },
      {
        key: "CLOUDFLARE_ENABLED",
        label: "Cloudflare Enabled",
        type: "boolean",
        description: "Toggle Cloudflare-aware host behavior.",
      },
      {
        key: "TLS_ENABLED",
        label: "TLS Enabled",
        type: "boolean",
        description: "Toggle HTTPS listener setup.",
      },
      {
        key: "TLS_KEY_PATH",
        label: "TLS Key Path",
        type: "string",
        description: "Private key path for HTTPS.",
        placeholder: "certs/server.key",
      },
      {
        key: "TLS_CERT_PATH",
        label: "TLS Certificate Path",
        type: "string",
        description: "Certificate path for HTTPS.",
        placeholder: "certs/server.crt",
      },
    ],
  },
  {
    id: "frontend",
    label: "Frontend",
    summary: "Frontend domain and host values used by the shared application shell.",
    fields: [
      {
        key: "FRONTEND_DOMAIN",
        label: "Frontend Domain",
        type: "string",
        description: "Canonical frontend domain.",
        placeholder: "app.codexsun.local",
        required: true,
      },
      {
        key: "FRONTEND_HOST",
        label: "Frontend Host",
        type: "string",
        description: "Frontend host binding for local dev.",
        placeholder: "0.0.0.0",
        required: true,
      },
      {
        key: "FRONTEND_HTTP_PORT",
        label: "Frontend HTTP Port",
        type: "number",
        description: "HTTP port for the frontend shell.",
        placeholder: "5173",
        required: true,
      },
      {
        key: "FRONTEND_HTTPS_PORT",
        label: "Frontend HTTPS Port",
        type: "number",
        description: "HTTPS port for the frontend shell.",
        placeholder: "5174",
        required: true,
      },
      {
        key: "VITE_FRONTEND_TARGET",
        label: "Frontend Target",
        type: "select",
        description:
          "Select whether the frontend home opens the portfolio site, ecommerce storefront, or billing app login.",
        required: true,
        options: [
          { label: "Site", value: "site" },
          { label: "Shop", value: "shop" },
          { label: "App", value: "app" },
        ],
      },
    ],
  },
  {
    id: "feedback-toasts",
    label: "Toasts",
    summary: "Global toast placement and visual tone used by the shared application feedback layer.",
    fields: [
      {
        key: "VITE_TOAST_POSITION",
        label: "Toast Position",
        type: "select",
        description: "Default toast stack position across the suite.",
        required: true,
        options: [
          { label: "Top Left", value: "top-left" },
          { label: "Top Center", value: "top-center" },
          { label: "Top Right", value: "top-right" },
          { label: "Bottom Left", value: "bottom-left" },
          { label: "Bottom Center", value: "bottom-center" },
          { label: "Bottom Right", value: "bottom-right" },
        ],
      },
      {
        key: "VITE_TOAST_TONE",
        label: "Toast Tone",
        type: "select",
        description: "Choose between soft surface toasts and solid high-contrast toasts.",
        required: true,
        options: [
          { label: "Soft", value: "soft" },
          { label: "Solid", value: "solid" },
        ],
      },
    ],
  },
  {
    id: "database",
    label: "Database",
    summary: "Primary runtime storage including MariaDB, PostgreSQL, or SQLite fallback.",
    fields: [
      {
        key: "DB_DRIVER",
        label: "Database Driver",
        type: "select",
        description: "Primary runtime database driver.",
        required: true,
        options: [
          { label: "MariaDB", value: "mariadb" },
          { label: "PostgreSQL", value: "postgres" },
          { label: "SQLite", value: "sqlite" },
        ],
      },
      {
        key: "DB_HOST",
        label: "Database Host",
        type: "string",
        description: "Host for network database connections.",
        placeholder: "127.0.0.1",
      },
      {
        key: "DB_PORT",
        label: "Database Port",
        type: "number",
        description: "Port for network database connections.",
        placeholder: "3306",
      },
      {
        key: "DB_NAME",
        label: "Database Name",
        type: "string",
        description: "Primary database name.",
        placeholder: "codexsun_db",
      },
      {
        key: "DB_USER",
        label: "Database User",
        type: "string",
        description: "Database login user.",
        placeholder: "root",
      },
      {
        key: "DB_PASSWORD",
        label: "Database Password",
        type: "password",
        description: "Database login password.",
      },
      {
        key: "DB_SSL",
        label: "Database SSL",
        type: "boolean",
        description: "Enable SSL for the primary database connection.",
      },
      {
        key: "SQLITE_FILE",
        label: "SQLite File",
        type: "string",
        description: "SQLite file path used for local or offline runtime.",
        placeholder: "storage/desktop/codexsun.sqlite",
        required: true,
      },
      {
        key: "OFFLINE_SUPPORT_ENABLED",
        label: "Offline Support",
        type: "boolean",
        description: "Enable offline SQLite support in the runtime.",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    summary: "Optional analytics database connection used for reporting or secondary workloads.",
    fields: [
      {
        key: "ANALYTICS_DB_ENABLED",
        label: "Analytics Database Enabled",
        type: "boolean",
        description: "Enable the analytics PostgreSQL connection.",
      },
      {
        key: "ANALYTICS_DB_HOST",
        label: "Analytics Host",
        type: "string",
        description: "Analytics database host.",
      },
      {
        key: "ANALYTICS_DB_PORT",
        label: "Analytics Port",
        type: "number",
        description: "Analytics database port.",
        placeholder: "5432",
      },
      {
        key: "ANALYTICS_DB_NAME",
        label: "Analytics Database Name",
        type: "string",
        description: "Analytics database name.",
      },
      {
        key: "ANALYTICS_DB_USER",
        label: "Analytics Database User",
        type: "string",
        description: "Analytics database user.",
      },
      {
        key: "ANALYTICS_DB_PASSWORD",
        label: "Analytics Database Password",
        type: "password",
        description: "Analytics database password.",
      },
      {
        key: "ANALYTICS_DB_SSL",
        label: "Analytics SSL",
        type: "boolean",
        description: "Enable SSL for the analytics database connection.",
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    summary: "JWT, login limits, secret ownership, and internal access policy values.",
    fields: [
      {
        key: "JWT_SECRET",
        label: "JWT Secret",
        type: "password",
        description: "Secret used to sign bearer tokens.",
        required: true,
      },
      {
        key: "JWT_EXPIRES_IN_SECONDS",
        label: "JWT Expiry Seconds",
        type: "number",
        description: "Access token expiry in seconds.",
        placeholder: "28800",
        required: true,
      },
      {
        key: "AUTH_MAX_LOGIN_ATTEMPTS",
        label: "Max Login Attempts",
        type: "number",
        description: "Maximum failed login attempts before lockout policy should apply.",
        placeholder: "5",
        required: true,
      },
      {
        key: "AUTH_LOCKOUT_MINUTES",
        label: "Lockout Minutes",
        type: "number",
        description: "Temporary lockout duration after repeated failed login attempts.",
        placeholder: "30",
        required: true,
      },
      {
        key: "ADMIN_SESSION_IDLE_MINUTES",
        label: "Admin Idle Minutes",
        type: "number",
        description: "Maximum idle minutes allowed for admin sessions before re-authentication policy applies.",
        placeholder: "30",
        required: true,
      },
      {
        key: "ADMIN_ALLOWED_IPS",
        label: "Admin Allowed IPs",
        type: "string",
        description: "Comma-separated exact IP or CIDR list allowed for admin access. Leave empty to allow all.",
        placeholder: "127.0.0.1, 10.0.0.0/24",
      },
      {
        key: "INTERNAL_API_ALLOWED_IPS",
        label: "Internal API Allowed IPs",
        type: "string",
        description: "Comma-separated exact IP or CIDR list allowed for internal API routes. Leave empty to allow all.",
        placeholder: "127.0.0.1, 10.0.0.0/24",
      },
      {
        key: "SECRET_ROTATION_DAYS",
        label: "Secret Rotation Days",
        type: "number",
        description: "Target cadence for rotating JWT, SMTP, payment, and connector secrets.",
        placeholder: "90",
        required: true,
      },
      {
        key: "SECRETS_LAST_ROTATED_AT",
        label: "Secrets Rotated At",
        type: "string",
        description: "ISO date for the last verified secret rotation event.",
        placeholder: "2026-04-07",
      },
      {
        key: "SECRET_OWNER_EMAIL",
        label: "Secret Owner Email",
        type: "string",
        description: "Primary owner responsible for secret rotation and safe storage.",
        placeholder: "security@example.com",
      },
      {
        key: "OPERATIONS_OWNER_EMAIL",
        label: "Operations Owner Email",
        type: "string",
        description: "Primary owner responsible for production operations and release access.",
        placeholder: "ops@example.com",
      },
    ],
  },
  {
    id: "observability",
    label: "Observability",
    summary: "Application log level and operator alert thresholds for checkout, webhook, and mail health.",
    fields: [
      {
        key: "APP_LOG_LEVEL",
        label: "App Log Level",
        type: "select",
        description: "Default application logging threshold.",
        required: true,
        options: [
          { label: "Debug", value: "debug" },
          { label: "Info", value: "info" },
          { label: "Warn", value: "warn" },
          { label: "Error", value: "error" },
        ],
      },
      {
        key: "OPS_ALERT_EMAILS",
        label: "Alert Emails",
        type: "string",
        description: "Comma-separated operator emails that should receive production alerts.",
        placeholder: "ops@example.com, finance@example.com",
      },
      {
        key: "OPS_ALERT_WEBHOOK_URL",
        label: "Alert Webhook URL",
        type: "string",
        description: "Webhook endpoint for chatops or incident management alert delivery.",
        placeholder: "https://hooks.example.com/services/...",
      },
      {
        key: "ALERT_CHECKOUT_FAILURE_THRESHOLD",
        label: "Checkout Failure Threshold",
        type: "number",
        description: "Alert threshold for checkout failures within the monitoring window.",
        placeholder: "5",
        required: true,
      },
      {
        key: "ALERT_PAYMENT_VERIFY_FAILURE_THRESHOLD",
        label: "Payment Verify Failure Threshold",
        type: "number",
        description: "Alert threshold for payment verification failures within the monitoring window.",
        placeholder: "3",
        required: true,
      },
      {
        key: "ALERT_WEBHOOK_FAILURE_THRESHOLD",
        label: "Webhook Failure Threshold",
        type: "number",
        description: "Alert threshold for payment webhook processing failures within the monitoring window.",
        placeholder: "3",
        required: true,
      },
      {
        key: "ALERT_ORDER_CREATION_FAILURE_THRESHOLD",
        label: "Order Creation Failure Threshold",
        type: "number",
        description: "Alert threshold for order creation failures within the monitoring window.",
        placeholder: "5",
        required: true,
      },
      {
        key: "ALERT_MAIL_FAILURE_THRESHOLD",
        label: "Mail Failure Threshold",
        type: "number",
        description: "Alert threshold for customer mail delivery failures within the monitoring window.",
        placeholder: "10",
        required: true,
      },
    ],
  },
  {
    id: "operations-governance",
    label: "Operations",
    summary: "Backup cadence, restore verification, audit logging, and security review checkpoints.",
    fields: [
      {
        key: "DB_BACKUP_ENABLED",
        label: "Backups Enabled",
        type: "boolean",
        description: "Enable scheduled database backup operations.",
      },
      {
        key: "DB_BACKUP_CADENCE_HOURS",
        label: "Backup Cadence Hours",
        type: "number",
        description: "Target interval between full database backups.",
        placeholder: "24",
        required: true,
      },
      {
        key: "DB_BACKUP_RETENTION_DAYS",
        label: "Backup Retention Days",
        type: "number",
        description: "Retention period for backup artifacts before purge.",
        placeholder: "14",
        required: true,
      },
      {
        key: "DB_BACKUP_MAX_FILES",
        label: "Backup Max Files",
        type: "number",
        description: "Maximum number of retained database backups in local storage.",
        placeholder: "5",
        required: true,
      },
      {
        key: "DB_BACKUP_LAST_VERIFIED_AT",
        label: "Backup Verified At",
        type: "string",
        description: "ISO date for the last successful restore drill or backup verification.",
        placeholder: "2026-04-07",
      },
      {
        key: "GDRIVE_BACKUP_ENABLED",
        label: "Google Drive Backup",
        type: "boolean",
        description: "Upload completed backups to Google Drive after local archival.",
      },
      {
        key: "GDRIVE_CLIENT_ID",
        label: "Google Drive Client Id",
        type: "string",
        description: "OAuth client id for Google Drive backup uploads.",
      },
      {
        key: "GDRIVE_CLIENT_SECRET",
        label: "Google Drive Client Secret",
        type: "password",
        description: "OAuth client secret for Google Drive backup uploads.",
      },
      {
        key: "GDRIVE_REFRESH_TOKEN",
        label: "Google Drive Refresh Token",
        type: "password",
        description: "OAuth refresh token used to obtain Google Drive access tokens.",
      },
      {
        key: "GDRIVE_FOLDER_ID",
        label: "Google Drive Folder Id",
        type: "string",
        description: "Target Google Drive folder id for uploaded database backups.",
      },
      {
        key: "ADMIN_AUDIT_LOG_ENABLED",
        label: "Admin Audit Log",
        type: "boolean",
        description: "Record admin-critical actions in the platform audit ledger.",
      },
      {
        key: "SUPPORT_EVENT_LOG_ENABLED",
        label: "Support Event Log",
        type: "boolean",
        description: "Record support-safe operational events for follow-up and customer service review.",
      },
      {
        key: "SECURITY_CHECKLIST_LAST_REVIEWED_AT",
        label: "Security Reviewed At",
        type: "string",
        description: "ISO date for the last completed security checklist review.",
        placeholder: "2026-04-07",
      },
    ],
  },
  {
    id: "auth",
    label: "Auth",
    summary: "OTP behavior and elevated-access defaults for the shared authentication flow.",
    fields: [
      {
        key: "AUTH_OTP_DEBUG",
        label: "OTP Debug",
        type: "boolean",
        description: "Keep OTP responses visible for development and testing.",
      },
      {
        key: "AUTH_OTP_EXPIRY_MINUTES",
        label: "OTP Expiry Minutes",
        type: "number",
        description: "Time window before OTP codes expire.",
        placeholder: "10",
        required: true,
      },
      {
        key: "SUPER_ADMIN_EMAILS",
        label: "Super Admin Emails",
        type: "string",
        description: "Comma-separated email list granted super-admin access.",
        placeholder: "admin@example.com,owner@example.com",
      },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    summary: "SMTP values used for OTP, recovery, and outbound system email.",
    fields: [
      {
        key: "SMTP_HOST",
        label: "SMTP Host",
        type: "string",
        description: "SMTP relay host.",
        placeholder: "smtp.gmail.com",
        required: true,
      },
      {
        key: "SMTP_PORT",
        label: "SMTP Port",
        type: "number",
        description: "SMTP relay port.",
        placeholder: "465",
        required: true,
      },
      {
        key: "SMTP_SECURE",
        label: "SMTP Secure",
        type: "boolean",
        description: "Use a secure SMTP transport.",
      },
      {
        key: "SMTP_USER",
        label: "SMTP User",
        type: "string",
        description: "SMTP login user.",
      },
      {
        key: "SMTP_PASS",
        label: "SMTP Password",
        type: "password",
        description: "SMTP login password.",
      },
      {
        key: "SMTP_FROM_EMAIL",
        label: "From Email",
        type: "string",
        description: "Default sender email address.",
      },
      {
        key: "SMTP_FROM_NAME",
        label: "From Name",
        type: "string",
        description: "Default sender display name.",
        placeholder: "codexsun",
        required: true,
      },
    ],
  },
  {
    id: "commerce-storefront",
    label: "Commerce Storefront",
    summary: "Storefront shipping thresholds and default commerce checkout values.",
    fields: [
      {
        key: "ECOMMERCE_FREE_SHIPPING_THRESHOLD",
        label: "Free Shipping Threshold",
        type: "number",
        description: "Cart total above which shipping becomes free.",
        placeholder: "3999",
        required: true,
      },
      {
        key: "ECOMMERCE_DEFAULT_SHIPPING_AMOUNT",
        label: "Default Shipping Amount",
        type: "number",
        description: "Shipping charge applied below the free shipping threshold.",
        placeholder: "149",
        required: true,
      },
    ],
  },
  {
    id: "commerce-razorpay",
    label: "Razorpay",
    summary: "Payment gateway credentials for the ecommerce checkout surface.",
    fields: [
      {
        key: "RAZORPAY_ENABLED",
        label: "Razorpay Enabled",
        type: "boolean",
        description: "Enable live Razorpay order creation and signature verification.",
      },
      {
        key: "RAZORPAY_KEY_ID",
        label: "Razorpay Key Id",
        type: "string",
        description: "Public Razorpay key id used by checkout.",
      },
      {
        key: "RAZORPAY_KEY_SECRET",
        label: "Razorpay Key Secret",
        type: "password",
        description: "Secret key used for order creation and signature verification.",
      },
      {
        key: "RAZORPAY_WEBHOOK_SECRET",
        label: "Razorpay Webhook Secret",
        type: "password",
        description: "Webhook signing secret used to validate server-to-server Razorpay events.",
      },
    ],
  },
  {
    id: "billing-compliance",
    label: "Billing",
    summary: "Shared billing year and statutory integration settings.",
    fields: [
      {
        key: "BILLING_FINANCIAL_YEAR_START_MONTH",
        label: "Financial Year Start Month",
        type: "number",
        description: "Financial year start month for billing calculations.",
        placeholder: "4",
        required: true,
      },
      {
        key: "BILLING_FINANCIAL_YEAR_START_DAY",
        label: "Financial Year Start Day",
        type: "number",
        description: "Financial year start day for billing calculations.",
        placeholder: "1",
        required: true,
      },
      {
        key: "BILLING_LOCK_DATE",
        label: "Billing Lock Date",
        type: "string",
        description: "No billing voucher may be created, updated, or reversed on or before this ISO date.",
        placeholder: "2026-03-31",
      },
      {
        key: "BILLING_PERIOD_CLOSED_THROUGH",
        label: "Closed Through Date",
        type: "string",
        description: "Accounting periods through this ISO date are treated as closed for billing operations.",
        placeholder: "2026-03-31",
      },
      {
        key: "BILLING_DOCUMENT_NUMBERING_POLICY",
        label: "Numbering Policy",
        type: "select",
        description: "Choose whether billing documents are always auto-numbered, always manually numbered, or allow both.",
        required: true,
        options: [
          { label: "Hybrid", value: "hybrid" },
          { label: "Auto", value: "auto" },
          { label: "Manual", value: "manual" },
        ],
      },
      {
        key: "BILLING_REVIEW_ENABLED",
        label: "Sensitive Review Enabled",
        type: "boolean",
        description: "Require finance review metadata for sensitive billing documents.",
      },
      {
        key: "BILLING_REVIEW_THRESHOLD_AMOUNT",
        label: "Review Threshold",
        type: "number",
        description: "Voucher total at or above this amount enters finance review when review mode is enabled.",
        placeholder: "50000",
        required: true,
      },
      {
        key: "BILLING_STOCK_VALUATION_METHOD",
        label: "Stock Valuation Method",
        type: "select",
        description: "Inventory valuation policy used by billing stock reporting and stock-to-account interpretation.",
        required: true,
        options: [
          { label: "Weighted Average", value: "weighted_average" },
          { label: "Moving Average", value: "moving_average" },
          { label: "FIFO", value: "fifo" },
        ],
      },
    ],
  },
  {
    id: "billing-prefixes",
    label: "Billing Prefixes",
    summary: "Document prefix controls used by billing auto-numbering across finance documents.",
    fields: [
      {
        key: "BILLING_PREFIX_PAYMENT",
        label: "Payment Prefix",
        type: "string",
        description: "Auto-number prefix for payment vouchers.",
      },
      {
        key: "BILLING_PREFIX_RECEIPT",
        label: "Receipt Prefix",
        type: "string",
        description: "Auto-number prefix for receipt vouchers.",
      },
      {
        key: "BILLING_PREFIX_SALES",
        label: "Sales Prefix",
        type: "string",
        description: "Auto-number prefix for sales invoices.",
      },
      {
        key: "BILLING_PREFIX_SALES_RETURN",
        label: "Sales Return Prefix",
        type: "string",
        description: "Auto-number prefix for sales return documents.",
      },
      {
        key: "BILLING_PREFIX_CREDIT_NOTE",
        label: "Credit Note Prefix",
        type: "string",
        description: "Auto-number prefix for credit notes.",
      },
      {
        key: "BILLING_PREFIX_PURCHASE",
        label: "Purchase Prefix",
        type: "string",
        description: "Auto-number prefix for purchase vouchers.",
      },
      {
        key: "BILLING_PREFIX_PURCHASE_RETURN",
        label: "Purchase Return Prefix",
        type: "string",
        description: "Auto-number prefix for purchase return documents.",
      },
      {
        key: "BILLING_PREFIX_DEBIT_NOTE",
        label: "Debit Note Prefix",
        type: "string",
        description: "Auto-number prefix for debit notes.",
      },
      {
        key: "BILLING_PREFIX_STOCK_ADJUSTMENT",
        label: "Stock Adjustment Prefix",
        type: "string",
        description: "Auto-number prefix for stock adjustment vouchers.",
      },
      {
        key: "BILLING_PREFIX_LANDED_COST",
        label: "Landed Cost Prefix",
        type: "string",
        description: "Auto-number prefix for landed cost vouchers.",
      },
      {
        key: "BILLING_PREFIX_CONTRA",
        label: "Contra Prefix",
        type: "string",
        description: "Auto-number prefix for contra vouchers.",
      },
      {
        key: "BILLING_PREFIX_JOURNAL",
        label: "Journal Prefix",
        type: "string",
        description: "Auto-number prefix for journal vouchers.",
      },
    ],
  },
  {
    id: "billing-einvoice",
    label: "E-Invoice",
    summary: "GST e-invoice provider credentials and mode selection.",
    fields: [
      {
        key: "BILLING_EINVOICE_ENABLED",
        label: "E-Invoice Enabled",
        type: "boolean",
        description: "Enable e-invoice integration.",
      },
      {
        key: "BILLING_EINVOICE_MODE",
        label: "E-Invoice Mode",
        type: "select",
        description: "Use explicit manual-compliance or live e-invoice mode.",
        required: true,
        options: [
          { label: "Manual", value: "manual" },
          { label: "Live", value: "live" },
        ],
      },
      {
        key: "BILLING_EINVOICE_BASE_URL",
        label: "E-Invoice Base URL",
        type: "string",
        description: "Provider base URL for e-invoice calls.",
      },
      {
        key: "BILLING_EINVOICE_USERNAME",
        label: "E-Invoice Username",
        type: "string",
        description: "Provider username.",
      },
      {
        key: "BILLING_EINVOICE_PASSWORD",
        label: "E-Invoice Password",
        type: "password",
        description: "Provider password.",
      },
      {
        key: "BILLING_EINVOICE_CLIENT_ID",
        label: "E-Invoice Client ID",
        type: "string",
        description: "Provider client id.",
      },
      {
        key: "BILLING_EINVOICE_CLIENT_SECRET",
        label: "E-Invoice Client Secret",
        type: "password",
        description: "Provider client secret.",
      },
      {
        key: "BILLING_EINVOICE_GSTIN",
        label: "E-Invoice GSTIN",
        type: "string",
        description: "GSTIN used for e-invoice calls.",
      },
    ],
  },
  {
    id: "billing-ewaybill",
    label: "E-Way Bill",
    summary: "E-way bill provider credentials and mode selection.",
    fields: [
      {
        key: "BILLING_EWAYBILL_ENABLED",
        label: "E-Way Bill Enabled",
        type: "boolean",
        description: "Enable e-way bill integration.",
      },
      {
        key: "BILLING_EWAYBILL_MODE",
        label: "E-Way Bill Mode",
        type: "select",
        description: "Use explicit manual-compliance or live e-way bill mode.",
        required: true,
        options: [
          { label: "Manual", value: "manual" },
          { label: "Live", value: "live" },
        ],
      },
      {
        key: "BILLING_EWAYBILL_BASE_URL",
        label: "E-Way Bill Base URL",
        type: "string",
        description: "Provider base URL for e-way bill calls.",
      },
      {
        key: "BILLING_EWAYBILL_USERNAME",
        label: "E-Way Bill Username",
        type: "string",
        description: "Provider username.",
      },
      {
        key: "BILLING_EWAYBILL_PASSWORD",
        label: "E-Way Bill Password",
        type: "password",
        description: "Provider password.",
      },
      {
        key: "BILLING_EWAYBILL_CLIENT_ID",
        label: "E-Way Bill Client ID",
        type: "string",
        description: "Provider client id.",
      },
      {
        key: "BILLING_EWAYBILL_CLIENT_SECRET",
        label: "E-Way Bill Client Secret",
        type: "password",
        description: "Provider client secret.",
      },
      {
        key: "BILLING_EWAYBILL_GSTIN",
        label: "E-Way Bill GSTIN",
        type: "string",
        description: "GSTIN used for e-way bill calls.",
      },
    ],
  },
]

export const runtimeSettingKeys = runtimeSettingGroups.flatMap((group) =>
  group.fields.map((field) => field.key)
)

export type RuntimeSettingField = RuntimeSettingFieldDefinition
export type RuntimeSettingGroup = RuntimeSettingGroupDefinition
export type RuntimeSettingsSnapshot = z.infer<typeof runtimeSettingsSnapshotSchema>
export type RuntimeSettingsSavePayload = z.infer<typeof runtimeSettingsSavePayloadSchema>
export type RuntimeSettingsSaveResponse = z.infer<typeof runtimeSettingsSaveResponseSchema>
