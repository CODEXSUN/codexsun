import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const taskAppWorkspace = defineAppWorkspace("task", "Task")

export * from "./workspace-items.js"
