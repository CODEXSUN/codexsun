import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { cliAppWorkspace } from "../shared/index.js"

export const cliAppManifest: AppManifest = {
  id: "cli",
  name: "CLI",
  kind: "ops",
  description:
    "Operational tooling for builds, diagnostics, releases, server control, and environment checks.",
  standalone: true,
  dependencies: ["framework"],
  workspace: cliAppWorkspace,
  surfaces: {
    internalApi: true,
  },
}
