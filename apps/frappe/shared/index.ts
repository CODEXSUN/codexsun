import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const frappeAppWorkspace = defineAppWorkspace("frappe", "Frappe")

export * from "./workspace-items.js"
export * from "./schemas/frappe.js"
