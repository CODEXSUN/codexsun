import { defineAppWorkspace } from "../src/application/app-workspace.js"

export const frameworkAppWorkspace = defineAppWorkspace("framework", "Framework")
export * from "./app-settings.js"
export * from "./media.js"
export * from "./runtime-settings.js"
