import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { crmAppWorkspace } from "../shared/index.js"

export const crmAppManifest: AppManifest = {
  id: "crm",
  name: "CRM",
  kind: "business",
  description:
    "Customer relationship management: cold calls, lead pipeline, task-linked follow-ups, and sales orchestration.",
  standalone: true,
  dependencies: ["framework", "core", "api", "ui", "task"],
  workspace: crmAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
    externalApi: false,
  },
}
