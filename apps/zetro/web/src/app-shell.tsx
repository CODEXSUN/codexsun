import { zetroAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function ZetroAppShell() {
  return (
    <AppWorkspacePreview
      manifest={zetroAppManifest}
      accent="Agent operations"
      capabilities={[
        "Turns agent workflow ideas into governed app-owned playbooks.",
        "Keeps Claude Code adaption analysis separate from runtime automation.",
        "Prepares review, guardrail, and rollout lanes for supervised delivery.",
      ]}
    />
  )
}

export default ZetroAppShell
