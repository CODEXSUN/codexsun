import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { siteAppWorkspace } from "../shared/index.js"

export function getSiteWorkspace(): AppWorkspaceDescriptor {
  return siteAppWorkspace
}
