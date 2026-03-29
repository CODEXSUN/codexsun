import { cliAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function CliAppShell() {
  return (
    <AppWorkspacePreview
      manifest={cliAppManifest}
      accent="Operational tooling"
      capabilities={[
        "Owns diagnostics, release helpers, and environment checks.",
        "Stays separate from browser flows even when it supports them.",
        "Can expose control surfaces without becoming the server host.",
      ]}
    />
  )
}

export default CliAppShell
