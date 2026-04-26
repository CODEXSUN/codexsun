export type InventoryWorkspaceRegistration = {
  engineId: string
  workspaceKey: string
  label: string
  summary: string
}

export interface CxappInventoryAdapter {
  registerInventoryWorkspaces(): Promise<InventoryWorkspaceRegistration[]>
}
