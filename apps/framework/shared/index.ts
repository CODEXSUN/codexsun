import { defineAppWorkspace } from "../src/application/app-workspace.js"

export const frameworkAppWorkspace = defineAppWorkspace("framework", "Framework")
export * from "./activity-log.js"
export * from "./app-settings.js"
export * from "./database-operations.js"
export * from "./media.js"
export * from "./monitoring.js"
export * from "./runtime-jobs.js"
export * from "./runtime-settings.js"
