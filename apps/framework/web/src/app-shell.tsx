import { frameworkAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function FrameworkAppShell() {
  return (
    <AppWorkspacePreview
      manifest={frameworkAppManifest}
      accent="Runtime composition root"
      capabilities={[
        "Owns DI registration and app-suite assembly.",
        "Owns HTTP hosting, config, and database orchestration.",
        "Remains reusable beneath cxapp and future standalone products.",
      ]}
    />
  )
}

export default FrameworkAppShell
