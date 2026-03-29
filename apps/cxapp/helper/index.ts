import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { cxappAppWorkspace } from "../shared/index.js"

export function getCxappWorkspace(): AppWorkspaceDescriptor {
  return cxappAppWorkspace
}
