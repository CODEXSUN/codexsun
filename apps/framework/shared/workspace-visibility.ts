export type WorkspaceMode = "demo" | "tenant" | "control-plane"

export type WorkspaceProfile =
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

export type WorkspaceVisibilityInput = {
  mode: WorkspaceMode
  tenantId: string
  clientOverlayId: string | null
  industryPackId: string | null
  workspaceProfile: WorkspaceProfile
  enabledApps: string[]
  enabledFeatureFlags: string[]
}

export type WorkspaceVisibilityDecision = {
  id: string
  visible: boolean
  source:
    | "platform-default"
    | "industry-pack"
    | "client-overlay"
    | "workspace-profile"
    | "feature-flag"
  reason: string
}

export type WorkspaceVisibilityResolution = {
  input: WorkspaceVisibilityInput
  decisions: WorkspaceVisibilityDecision[]
}
