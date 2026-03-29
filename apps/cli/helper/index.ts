import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { cliAppWorkspace } from "../shared/index.js"
export { runGitHubHelper } from "../src/github-helper.js"

export function getCliWorkspace(): AppWorkspaceDescriptor {
  return cliAppWorkspace
}
