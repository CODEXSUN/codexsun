import type { BaseModuleManifest } from "./shared.js"

export type EngineManifest = BaseModuleManifest & {
  kind: "engine"
}
