import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const coreAppWorkspace = defineAppWorkspace("core", "Core")

export * from "./workspace-items.js"
export * from "./config/navigation.js"
export * from "./domain/module-registry.js"
export * from "./domain/platform.js"
export * from "./schemas/auth.js"
export * from "./schemas/bootstrap.js"
export * from "./schemas/common-modules.js"
export * from "./schemas/company.js"
export * from "./schemas/contact.js"
export * from "./schemas/mailbox.js"
