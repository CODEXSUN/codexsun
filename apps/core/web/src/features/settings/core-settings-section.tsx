import { RuntimeSettingsScreen } from "./runtime-settings-screen"

export function CoreSettingsSection() {
  return (
    <RuntimeSettingsScreen
      title="Core Settings"
      description="Runtime environment settings and shared operational guardrails for the suite. Changes are saved to the active runtime .env, such as /opt/codexsun/app/.env."
      recordId="core-settings"
      recordName="Runtime environment"
    />
  )
}
