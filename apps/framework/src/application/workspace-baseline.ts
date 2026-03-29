import type { AppManifest, AppSuite } from "./app-manifest.js"

const standardAppShape = [
  "src",
  "web",
  "database/migration",
  "database/seeder",
  "helper",
  "shared",
] as const

function toBaselineApp(app: AppManifest) {
  return {
    id: app.id,
    name: app.name,
    kind: app.kind,
    standalone: app.standalone,
    description: app.description,
    dependencies: app.dependencies,
    workspace: app.workspace,
    surfaces: app.surfaces,
  }
}

export function createWorkspaceHostBaseline(appSuite: AppSuite) {
  return {
    activeShell: {
      appId: "cxapp",
      webEntry: "apps/cxapp/web/src/main.tsx",
      webShell: "apps/cxapp/web/src/app-shell.tsx",
      serverEntry: "apps/cxapp/src/server/index.ts",
    },
    frameworkHost: {
      serverEntry: "apps/framework/src/server/index.ts",
      applicationRoot: "apps/framework/src/application",
      diRoot: "apps/framework/src/di",
      configRoot: "apps/framework/src/runtime/config",
      databaseRoot: "apps/framework/src/runtime/database",
      httpRoot: "apps/framework/src/runtime/http",
    },
    build: {
      appRoot: "build/app",
      moduleRoot: "build/module",
      activeOutputs: {
        web: "build/app/cxapp/web",
        server: "build/app/cxapp/server",
      },
    },
    standardAppShape,
    framework: toBaselineApp(appSuite.framework),
    apps: appSuite.apps.map((app) => toBaselineApp(app)),
  }
}

export type WorkspaceHostBaseline = ReturnType<typeof createWorkspaceHostBaseline>
