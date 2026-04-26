import type { BaseModuleManifest } from "./shared.js"

export type AppManifest = BaseModuleManifest & {
  kind: "app"
  workspaceRoot?: string
}
