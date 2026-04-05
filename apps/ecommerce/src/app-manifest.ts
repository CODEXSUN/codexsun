import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { ecommerceAppWorkspace } from "../shared/index.js"

export const ecommerceAppManifest: AppManifest = {
  id: "ecommerce",
  name: "Ecommerce",
  kind: "business",
  description:
    "Standalone storefront app that consumes shared masters from core and owns customer commerce flows end to end.",
  standalone: true,
  dependencies: ["framework", "core", "api", "ui"],
  workspace: ecommerceAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
    externalApi: true,
  },
}
