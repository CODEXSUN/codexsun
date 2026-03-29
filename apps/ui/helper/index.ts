import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { uiAppWorkspace } from "../shared/index.js"

export function getUiWorkspace(): AppWorkspaceDescriptor {
  return uiAppWorkspace
}
