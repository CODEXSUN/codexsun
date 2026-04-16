import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const stockAppWorkspace = defineAppWorkspace("stock", "Stock")

export * from "./workspace-items.js"
export * from "./schemas.js"
