import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { zetroAppWorkspace } from "../shared/index.js"

export function getZetroWorkspace(): AppWorkspaceDescriptor {
  return zetroAppWorkspace
}
