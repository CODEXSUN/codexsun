import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { zetroAppWorkspace } from "../shared/index.js"

export const zetroAppManifest: AppManifest = {
  id: "zetro",
  name: "Zetro",
  kind: "ops",
  description:
    "Agent operations workspace for Claude Code adaption analysis, governed playbooks, review lanes, and supervised rollout planning.",
  standalone: true,
  dependencies: ["framework", "core", "api", "ui", "task", "cli"],
  workspace: zetroAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
  },
}
