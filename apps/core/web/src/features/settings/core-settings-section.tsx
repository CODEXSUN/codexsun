import { RuntimeSettingsScreen } from "./runtime-settings-screen"

export function CoreSettingsSection() {
  return (
    <RuntimeSettingsScreen
      title="Core Settings"
      description="Runtime environment settings and shared operational guardrails for the suite."
      recordId="core-settings"
      recordName="Runtime environment"
    />
  )
}
