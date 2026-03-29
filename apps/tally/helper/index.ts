import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { tallyAppWorkspace } from "../shared/index.js"

export function getTallyWorkspace(): AppWorkspaceDescriptor {
  return tallyAppWorkspace
}
