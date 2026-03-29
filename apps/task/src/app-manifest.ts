import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { taskAppWorkspace } from "../shared/index.js"

export const taskAppManifest: AppManifest = {
  id: "task",
  name: "Task",
  kind: "business",
  description:
    "Enterprise task management, workspaces, team flow, and operational task orchestration.",
  standalone: true,
  dependencies: ["framework", "core", "api", "ui"],
  workspace: taskAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
    externalApi: true,
  },
}
