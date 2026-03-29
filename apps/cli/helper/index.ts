import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { cliAppWorkspace } from "../shared/index.js"

export function getCliWorkspace(): AppWorkspaceDescriptor {
  return cliAppWorkspace
}
