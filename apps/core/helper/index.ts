import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { coreAppWorkspace } from "../shared/index.js"

export function getCoreWorkspace(): AppWorkspaceDescriptor {
  return coreAppWorkspace
}
