import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { apiAppWorkspace } from "../shared/index.js"

export const apiAppManifest: AppManifest = {
  id: "api",
  name: "API",
  kind: "platform",
  description:
    "Dual route surface that exposes internal app integration contracts and external API contracts separately.",
  standalone: true,
  dependencies: ["framework", "core"],
  workspace: apiAppWorkspace,
  surfaces: {
    internalApi: true,
    externalApi: true,
  },
}
