import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { apiAppWorkspace } from "../shared/index.js"

export function getApiWorkspace(): AppWorkspaceDescriptor {
  return apiAppWorkspace
}
