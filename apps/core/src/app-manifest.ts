import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { coreAppWorkspace } from "../shared/index.js"

export const coreAppManifest: AppManifest = {
  id: "core",
  name: "Core",
  kind: "shared",
  description:
    "Shared masters, contacts, products, and reusable ERP-common domain foundations.",
  standalone: true,
  dependencies: ["framework"],
  workspace: coreAppWorkspace,
  surfaces: {
    internalApi: true,
  },
}
