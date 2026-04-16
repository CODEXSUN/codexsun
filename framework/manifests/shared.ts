export type ModuleKind = "engine" | "app" | "industry" | "client"

export type ModuleDependencyKind = "framework" | "engine" | "app" | "industry"

export type ModuleDependency = {
  id: string
  kind: ModuleDependencyKind
  optional?: boolean
}

export type BaseModuleManifest = {
  id: string
  kind: ModuleKind
  displayName: string
  summary: string
  dependencies: ModuleDependency[]
}
