import type { BaseModuleManifest } from "./shared.js"

export type ClientManifest = BaseModuleManifest & {
  kind: "client"
  industryId?: string | null
}
