import { RuntimeSettingsScreen } from "./runtime-settings-screen"

export function ObservabilitySettingsSection() {
  return (
    <RuntimeSettingsScreen
      title="Observability"
      description="Application log level, alert contacts, and failure thresholds for runtime monitoring."
      recordId="observability-settings"
      recordName="Observability settings"
      groupIds={["observability", "notifications"]}
    />
  )
}
