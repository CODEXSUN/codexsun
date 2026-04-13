export type FeatureFlagScope =
  | "platform"
  | "mode"
  | "industry"
  | "client"
  | "role"
  | "environment"

export type FeatureFlagValue = "inherit" | "enabled" | "disabled"

export type FeatureFlagAssignment = {
  key: string
  scope: FeatureFlagScope
  subjectId: string
  value: FeatureFlagValue
  reason: string
}

export type FeatureFlagResolutionInput = {
  mode: string
  industryPackId: string | null
  clientOverlayId: string | null
  workspaceProfile: string
  environment: string
  assignments: FeatureFlagAssignment[]
}

export type FeatureFlagResolutionDecision = {
  key: string
  enabled: boolean
  source: FeatureFlagScope | "module-default"
  subjectId: string
  reason: string
}

export type FeatureFlagResolution = {
  input: FeatureFlagResolutionInput
  decisions: FeatureFlagResolutionDecision[]
}
