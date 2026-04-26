import type { InventoryWorkspaceRegistration } from "../adapters/cxapp-adapter.js"

export type CxappInventoryWorkspaceMeta = {
  workspaceKey: string
  route: string
  icon: string | null
  appId: string
  featureFlag: string | null
  permissionKey: string | null
}

export type CxappInventoryWorkspaceTranslation = {
  registrations: InventoryWorkspaceRegistration[]
  metadata: CxappInventoryWorkspaceMeta[]
}
