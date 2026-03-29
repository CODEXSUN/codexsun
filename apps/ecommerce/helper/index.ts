import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { ecommerceAppWorkspace } from "../shared/index.js"

export function getEcommerceWorkspace(): AppWorkspaceDescriptor {
  return ecommerceAppWorkspace
}
