import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { tallyAppWorkspace } from "../shared/index.js"

export const tallyAppManifest: AppManifest = {
  id: "tally",
  name: "Tally",
  kind: "integration",
  description:
    "Standalone integration boundary for Tally-led financial exchange and connector workflows.",
  standalone: true,
  dependencies: ["framework", "api", "core"],
  workspace: tallyAppWorkspace,
  surfaces: {
    internalApi: true,
    externalApi: true,
    connector: true,
  },
}
