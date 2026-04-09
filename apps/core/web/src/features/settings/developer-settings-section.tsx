import { RuntimeSettingsScreen } from "./runtime-settings-screen"

export function DeveloperSettingsSection() {
  return (
    <RuntimeSettingsScreen
      title="Developer Settings"
      description="Framework developer aids, refactor visibility controls, and internal technical naming helpers."
      recordId="developer-settings"
      recordName="Developer settings"
      groupIds={["developer-tools"]}
    />
  )
}
