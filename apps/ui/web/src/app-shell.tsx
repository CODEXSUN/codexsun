import { uiAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function UiAppShell() {
  return (
    <AppWorkspacePreview
      manifest={uiAppManifest}
      accent="Shared design system"
      capabilities={[
        "Owns reusable primitives, themes, and shared CSS.",
        "Supports cxapp and future app shells without stealing domain ownership.",
        "Remains the single shared presentation boundary for the suite.",
      ]}
    />
  )
}

export default UiAppShell
