import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { siteAppWorkspace } from "../shared/index.js"

export const siteAppManifest: AppManifest = {
  id: "site",
  name: "Site",
  kind: "surface",
  description:
    "Static and marketing-facing surface that introduces the platform and its app suite.",
  standalone: true,
  dependencies: ["framework", "ui"],
  workspace: siteAppWorkspace,
  surfaces: {
    web: true,
  },
}
