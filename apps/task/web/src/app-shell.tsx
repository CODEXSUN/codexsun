import { taskAppManifest } from "../../src/app-manifest"
import { AppWorkspacePreview } from "@/components/ux/app-workspace-preview"

function TaskAppShell() {
  return (
    <AppWorkspacePreview
      manifest={taskAppManifest}
      accent="Work orchestration"
      capabilities={[
        "Owns enterprise workspaces, tasks, and team execution flows.",
        "Stays product-scoped rather than leaking into framework or core.",
        "Can evolve into desktop or focused web surfaces independently.",
      ]}
    />
  )
}

export default TaskAppShell
