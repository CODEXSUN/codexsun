import { RuntimeSettingsScreen } from "./runtime-settings-screen"

export function SecurityPolicySection() {
  return (
    <RuntimeSettingsScreen
      title="Security Policy"
      description="HTTPS enforcement, secret rotation ownership, login policy, and internal/admin access controls."
      recordId="security-policy"
      recordName="Security policy"
      groupIds={["application", "security", "auth"]}
    />
  )
}
