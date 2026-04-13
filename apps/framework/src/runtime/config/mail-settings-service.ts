import {
  mailSettingsSavePayloadSchema,
  mailSettingsSaveResponseSchema,
  mailSettingsSnapshotSchema,
  type MailSettingsSaveResponse,
  type MailSettingsSnapshot,
  type MailSettingsValues,
} from "../../../shared/mail-settings.js"

import {
  getRuntimeSettingsSnapshot,
  saveRuntimeSettings,
} from "./runtime-settings-service.js"

function pickMailSettingsValues(
  values: Record<string, string | boolean>
): MailSettingsValues {
  return {
    SMTP_HOST: typeof values.SMTP_HOST === "string" ? values.SMTP_HOST : "",
    SMTP_PORT: typeof values.SMTP_PORT === "string" ? values.SMTP_PORT : "",
    SMTP_SECURE: typeof values.SMTP_SECURE === "boolean" ? values.SMTP_SECURE : false,
    SMTP_USER: typeof values.SMTP_USER === "string" ? values.SMTP_USER : "",
    SMTP_PASS: typeof values.SMTP_PASS === "string" ? values.SMTP_PASS : "",
    SMTP_FROM_EMAIL:
      typeof values.SMTP_FROM_EMAIL === "string" ? values.SMTP_FROM_EMAIL : "",
    SMTP_FROM_NAME:
      typeof values.SMTP_FROM_NAME === "string" ? values.SMTP_FROM_NAME : "",
    AUTH_OTP_DEBUG:
      typeof values.AUTH_OTP_DEBUG === "boolean" ? values.AUTH_OTP_DEBUG : false,
    AUTH_OTP_EXPIRY_MINUTES:
      typeof values.AUTH_OTP_EXPIRY_MINUTES === "string"
        ? values.AUTH_OTP_EXPIRY_MINUTES
        : "",
  }
}

export function getMailSettingsSnapshot(cwd = process.cwd()): MailSettingsSnapshot {
  const runtimeSnapshot = getRuntimeSettingsSnapshot(cwd)

  return mailSettingsSnapshotSchema.parse({
    envFilePath: runtimeSnapshot.envFilePath,
    values: pickMailSettingsValues(runtimeSnapshot.values),
  })
}

export async function saveMailSettings(
  payload: unknown,
  cwd = process.cwd()
): Promise<MailSettingsSaveResponse> {
  const parsedPayload = mailSettingsSavePayloadSchema.parse(payload)
  const runtimeSnapshot = getRuntimeSettingsSnapshot(cwd)
  const runtimeSaveResponse = await saveRuntimeSettings(
    {
      restart: parsedPayload.restart,
      values: {
        ...runtimeSnapshot.values,
        ...parsedPayload.values,
      },
    },
    cwd
  )

  return mailSettingsSaveResponseSchema.parse({
    saved: runtimeSaveResponse.saved,
    restartScheduled: runtimeSaveResponse.restartScheduled,
    snapshot: {
      envFilePath: runtimeSaveResponse.snapshot.envFilePath,
      values: {
        ...pickMailSettingsValues(runtimeSaveResponse.snapshot.values),
        ...parsedPayload.values,
      },
    },
  })
}
