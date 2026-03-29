import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { taskAppWorkspace } from "../shared/index.js"

export function getTaskWorkspace(): AppWorkspaceDescriptor {
  return taskAppWorkspace
}
