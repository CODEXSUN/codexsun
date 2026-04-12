import { defineAppWorkspace } from "../../framework/src/application/app-workspace.js"

export const zetroAppWorkspace = defineAppWorkspace("zetro", "Zetro")

export * from "./workspace-items.js"
export * from "./claude-adaptation.js"
export * from "./output-modes.js"
export * from "./playbook-contracts.js"
export * from "./static-playbooks.js"
