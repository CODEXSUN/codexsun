import { tallyAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function TallyAppShell() {
  return (
    <AppWorkspacePreview
      manifest={tallyAppManifest}
      accent="Financial connector"
      capabilities={[
        "Owns Tally-specific exchange boundaries and mapping rules.",
        "Remains connector-scoped instead of becoming a business app.",
        "Supports future sync surfaces without bypassing the API split.",
      ]}
    />
  )
}

export default TallyAppShell
