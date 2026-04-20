import { z } from "zod"

const mailSettingsStringSchema = z.preprocess((value) => {
  if (value == null) {
    return ""
  }

  return String(value)
}, z.string())

const mailSettingsBooleanSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()

    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true
    }

    if (["0", "false", "no", "off"].includes(normalized)) {
      return false
    }
  }

  return value
}, z.boolean())

export const mailSettingsValuesSchema = z.object({
  SMTP_HOST: mailSettingsStringSchema,
  SMTP_PORT: mailSettingsStringSchema,
  SMTP_SECURE: mailSettingsBooleanSchema,
  SMTP_USER: mailSettingsStringSchema,
  SMTP_PASS: mailSettingsStringSchema,
  SMTP_FROM_EMAIL: mailSettingsStringSchema,
  SMTP_FROM_NAME: mailSettingsStringSchema,
  AUTH_OTP_DEBUG: mailSettingsBooleanSchema,
  AUTH_OTP_EXPIRY_MINUTES: mailSettingsStringSchema,
})

export const mailSettingsSnapshotSchema = z.object({
  envFilePath: z.string().min(1),
  values: mailSettingsValuesSchema,
})

export const mailSettingsSavePayloadSchema = z.object({
  values: mailSettingsValuesSchema,
  restart: z.boolean().optional().default(false),
})

export const mailSettingsSaveResponseSchema = z.object({
  saved: z.boolean(),
  restartScheduled: z.boolean(),
  snapshot: mailSettingsSnapshotSchema,
})

export type MailSettingsValues = z.infer<typeof mailSettingsValuesSchema>
export type MailSettingsSnapshot = z.infer<typeof mailSettingsSnapshotSchema>
export type MailSettingsSavePayload = z.infer<typeof mailSettingsSavePayloadSchema>
export type MailSettingsSaveResponse = z.infer<typeof mailSettingsSaveResponseSchema>
