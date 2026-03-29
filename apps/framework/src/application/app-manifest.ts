import type { AppWorkspaceDescriptor } from "./app-workspace.js"

export type AppKind =
  | "platform"
  | "shared"
  | "surface"
  | "business"
  | "integration"
  | "ops"

export type AppManifest = {
  id: string
  name: string
  kind: AppKind
  description: string
  standalone: boolean
  dependencies: string[]
  workspace: AppWorkspaceDescriptor
  surfaces: {
    web?: boolean
    internalApi?: boolean
    externalApi?: boolean
    desktop?: boolean
    connector?: boolean
  }
}

export type AppSuite = {
  framework: AppManifest
  apps: AppManifest[]
}
