export type WorkspacePermissionScopeType =
  | "desk"
  | "workspace"
  | "module"
  | "page"
  | "report"
  | "action"

export type WorkspacePermissionAction =
  | "view"
  | "manage"
  | "create"
  | "update"
  | "delete"
  | "export"
  | "print"
  | "approve"
  | "publish"
  | "sync"

export type WorkspacePermissionProfile =
  | "super-admin"
  | "admin"
  | "accounts"
  | "sales"
  | "warehouse"
  | "support"
  | "marketing"
  | "operations"
  | "teacher"
  | "student"
  | "parent"
  | "control-plane-super-admin"
  | "control-plane-operations"
  | "control-plane-accounts"
  | "control-plane-demo-admin"

export type WorkspacePermissionEntry = {
  profile: WorkspacePermissionProfile
  resourceId: string
  scopeType: WorkspacePermissionScopeType
  actions: WorkspacePermissionAction[]
  source:
    | "platform-default"
    | "industry-pack"
    | "client-overlay"
    | "workspace-profile"
    | "control-plane-policy"
  summary?: string | null
}

export type WorkspacePermissionMatrix = {
  entries: WorkspacePermissionEntry[]
}
