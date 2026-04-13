import { RuntimeSettingsScreen } from "./runtime-settings-screen"

export function MailSettingsSection() {
  return (
    <RuntimeSettingsScreen
      title="Mail Settings"
      description="SMTP transport values used for OTP, recovery, transactional mail, and outbound system email. Changes are saved to the active runtime .env file."
      recordId="mail-settings"
      recordName="Mail settings"
      groupIds={["notifications", "auth"]}
      endpoint="/internal/v1/cxapp/mail-settings"
      groupFieldKeys={{
        auth: ["AUTH_OTP_DEBUG", "AUTH_OTP_EXPIRY_MINUTES"],
      }}
      groupDisplayOverrides={{
        auth: {
          label: "Developer Testing",
          summary: "OTP debug and expiry controls used for mail-related auth testing flows.",
        },
      }}
    />
  )
}
