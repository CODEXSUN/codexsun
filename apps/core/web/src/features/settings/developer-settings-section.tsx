import { RuntimeSettingsScreen } from "./runtime-settings-screen"
import { DeveloperBuildRecoveryTab } from "./developer-build-recovery-tab"

export function DeveloperSettingsSection() {
  return (
    <RuntimeSettingsScreen
      title="Developer Settings"
      description="Framework developer aids, technical naming helpers, and frontend build recovery tools."
      recordId="developer-settings"
      recordName="Developer settings"
      groupIds={["developer-tools"]}
      extraTabs={[
        {
          label: "Build Recovery",
          value: "build-recovery",
          content: <DeveloperBuildRecoveryTab />,
        },
      ]}
    />
  )
}
