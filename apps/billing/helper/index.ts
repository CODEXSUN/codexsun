import type { AppWorkspaceDescriptor } from "../../framework/src/application/app-workspace.js"
import { billingAppWorkspace } from "../shared/index.js"

export function getBillingWorkspace(): AppWorkspaceDescriptor {
  return billingAppWorkspace
}
