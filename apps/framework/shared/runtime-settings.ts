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
    summary: "JWT and token-security values used by the shared auth runtime.",
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
        description: "Use mock or live e-invoice integration mode.",
        required: true,
        options: [
          { label: "Mock", value: "mock" },
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
        description: "Use mock or live e-way bill integration mode.",
        required: true,
        options: [
          { label: "Mock", value: "mock" },
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
