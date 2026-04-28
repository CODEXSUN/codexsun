import type { BaseModuleManifest } from "./shared.js"

export type IndustryManifest = BaseModuleManifest & {
  kind: "industry"
  enabledApps?: string[]
  enabledModuleIds?: string[]
  featureFlags?: string[]
}
