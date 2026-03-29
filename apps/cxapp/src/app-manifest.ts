import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { cxappAppWorkspace } from "../shared/index.js"

export const cxappAppManifest: AppManifest = {
  id: "cxapp",
  name: "CxApp",
  kind: "business",
  description:
    "Primary suite shell that composes the operational ERP experience across billing, commerce, tasks, and connectors.",
  standalone: true,
  dependencies: ["framework", "core", "api", "ui", "billing", "ecommerce", "task"],
  workspace: cxappAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
    externalApi: true,
    desktop: true,
  },
}
