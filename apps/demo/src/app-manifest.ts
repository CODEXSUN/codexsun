import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { demoAppWorkspace } from "../shared/index.js"

export const demoAppManifest: AppManifest = {
  id: "demo",
  name: "Demo",
  kind: "business",
  description:
    "Demo-data installer app that prepares default and richer showcase datasets across the suite without mixing ownership boundaries.",
  standalone: true,
  dependencies: ["framework", "core", "api", "ui", "cxapp", "ecommerce", "billing", "frappe"],
  workspace: demoAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
  },
}
