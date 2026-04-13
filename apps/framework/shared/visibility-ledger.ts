export type VisibilityLedgerTargetType =
  | "workspace"
  | "module"
  | "page"
  | "report"
  | "widget"
  | "action"
  | "feature-flag"

export type VisibilityLedgerSource =
  | "platform-default"
  | "mode"
  | "industry-pack"
  | "client-overlay"
  | "enabled-apps"
  | "workspace-profile"
  | "permission-matrix"
  | "feature-flag"

export type VisibilityLedgerEntry = {
  targetId: string
  targetType: VisibilityLedgerTargetType
  decision: "visible" | "hidden" | "allowed" | "denied"
  source: VisibilityLedgerSource
  reason: string
}

export type VisibilityLedgerRecord = {
  tenantId: string
  clientOverlayId: string | null
  industryPackId: string | null
  workspaceProfile: string
  entries: VisibilityLedgerEntry[]
}
