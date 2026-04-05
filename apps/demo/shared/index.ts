import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const demoAppWorkspace = defineAppWorkspace("demo", "Demo")

export * from "./workspace-items.js"
export * from "./schemas/demo.js"
