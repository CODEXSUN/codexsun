import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { frappeAppWorkspace } from "../shared/index.js"

export function getFrappeWorkspace(): AppWorkspaceDescriptor {
  return frappeAppWorkspace
}
