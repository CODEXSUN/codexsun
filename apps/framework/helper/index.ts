import type { AppWorkspaceDescriptor } from "../src/application/app-workspace.js"
import { frameworkAppWorkspace } from "../shared/index.js"

export function getFrameworkWorkspace(): AppWorkspaceDescriptor {
  return frameworkAppWorkspace
}
