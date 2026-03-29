import type { AppManifest } from "../../framework/src/application/app-manifest.js"
import { ecommerceAppWorkspace } from "../shared/index.js"

export const ecommerceAppManifest: AppManifest = {
  id: "ecommerce",
  name: "Ecommerce",
  kind: "business",
  description:
    "Storefront, product catalog, checkout flows, and customer commerce operations.",
  standalone: true,
  dependencies: ["framework", "core", "api", "ui"],
  workspace: ecommerceAppWorkspace,
  surfaces: {
    web: true,
    internalApi: true,
    externalApi: true,
  },
}
