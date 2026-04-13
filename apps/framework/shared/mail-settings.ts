import { z } from "zod"

export const mailSettingsValuesSchema = z.object({
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_SECURE: z.boolean(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  SMTP_FROM_EMAIL: z.string(),
  SMTP_FROM_NAME: z.string(),
  AUTH_OTP_DEBUG: z.boolean(),
  AUTH_OTP_EXPIRY_MINUTES: z.string(),
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
