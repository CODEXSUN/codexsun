import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const coreAppWorkspace = defineAppWorkspace("core", "Core")

export * from "./workspace-items.js"
export * from "./common-module-navigation.js"
export * from "./config/navigation.js"
export * from "./schemas/address-book.js"
export * from "./schemas/common-modules.js"
export * from "./schemas/contact.js"
export * from "./schemas/product.js"
