import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { uiAppWorkspace } from "../shared/index.js"

export const uiAppManifest: AppManifest = {
  id: "ui",
  name: "UI",
  kind: "shared",
  description:
    "Shared design system, theme assets, reusable primitives, and multi-app interface building blocks.",
  standalone: true,
  dependencies: [],
  workspace: uiAppWorkspace,
  surfaces: {
    web: true,
  },
}
