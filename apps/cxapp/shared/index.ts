import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const cxappAppWorkspace = defineAppWorkspace("cxapp", "CxApp")

export * from "./domain/module-registry.js"
export * from "./domain/platform.js"
export * from "./schemas/auth.js"
export * from "./schemas/bootstrap.js"
export * from "./schemas/company.js"
export * from "./schemas/mailbox.js"
export * from "./schemas/tenant-visibility.js"
export * from "./tenant-visibility-catalog.js"
