import type {
  CxappInventoryWorkspaceMeta,
  CxappInventoryWorkspaceTranslation,
} from "../../framework/engines/inventory-engine/translations/index.js"

export type CxappInventoryWorkspaceInput = {
  workspaceKey: string
  label: string
  summary: string
  route: string
  appId: string
  icon?: string | null
  featureFlag?: string | null
  permissionKey?: string | null
}

export function mapCxappInventoryWorkspaces(
  engineId: string,
  workspaces: CxappInventoryWorkspaceInput[]
): CxappInventoryWorkspaceTranslation {
  const metadata: CxappInventoryWorkspaceMeta[] = workspaces.map((workspace) => ({
    workspaceKey: workspace.workspaceKey,
    route: workspace.route,
    icon: workspace.icon ?? null,
    appId: workspace.appId,
    featureFlag: workspace.featureFlag ?? null,
    permissionKey: workspace.permissionKey ?? null,
  }))

  return {
    registrations: workspaces.map((workspace) => ({
      engineId,
      workspaceKey: workspace.workspaceKey,
      label: workspace.label,
      summary: workspace.summary,
    })),
    metadata,
  }
}
