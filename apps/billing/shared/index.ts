import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const billingAppWorkspace = defineAppWorkspace("billing", "Billing")

export * from "./workspace-items.js"
export * from "./voucher-modules.js"
export * from "./schemas/accounting.js"
export * from "./schemas/stock-operations.js"
export * from "./stock-workflow.js"
