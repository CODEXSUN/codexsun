import type { AppManifest } from "./application/app-manifest.js"
import { frameworkAppWorkspace } from "../shared/index.js"

export const frameworkAppManifest: AppManifest = {
  id: "framework",
  name: "Framework",
  kind: "platform",
  description:
    "Composition root, DI container, runtime services, HTTP host, auth, config, and database orchestration.",
  standalone: true,
  dependencies: ["core", "api", "ui"],
  workspace: frameworkAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
    externalApi: true,
    desktop: true,
  },
}
