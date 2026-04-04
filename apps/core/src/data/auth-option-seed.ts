import { createAppSuite } from "../../../framework/src/application/app-suite.js"
import type { AppSettingOption } from "../../../framework/shared/index.js"
import { billingWorkspaceItems } from "../../../billing/shared/index.js"
import { coreWorkspaceItems } from "../../shared/index.js"
import { ecommerceWorkspaceItems } from "../../../ecommerce/shared/index.js"
import { frappeWorkspaceItems } from "../../../frappe/shared/index.js"

function createOption(input: AppSettingOption): AppSettingOption {
  return input
}

const appSuite = createAppSuite()

const actorTypes = [
  ["admin", "Admin", "Administrative users across the suite."],
  ["staff", "Staff", "Operational staff users."],
  ["employee", "Employee", "Internal employee-facing users."],
  ["partner", "Partner", "Partner and channel users."],
  ["supplier", "Supplier", "Supplier-facing users."],
  ["customer", "Customer", "Customer-facing users."],
  ["vendor", "Vendor", "Vendor-facing users."],
] as const

const permissionScopeTypes = [
  ["desk", "Desk", "Top-level dashboard and shell surfaces."],
  ["workspace", "Workspace", "Whole application workspaces."],
  ["module", "Module", "Operational modules inside a workspace."],
  ["page", "Page", "Specific route/page surfaces."],
  ["report", "Report", "Report and statement surfaces."],
  ["module-def", "Module Def", "Shared platform or module-definition controls."],
] as const

const permissionActionTypes = [
  ["view", "View", "Read and open records."],
  ["manage", "Manage", "Full maintenance access."],
  ["create", "Create", "Create new records."],
  ["update", "Update", "Edit existing records."],
  ["delete", "Delete", "Delete or archive records."],
  ["export", "Export", "Export or download data."],
  ["print", "Print", "Print operational output."],
  ["approve", "Approve", "Approve workflow stages."],
  ["publish", "Publish", "Publish externally visible changes."],
  ["sync", "Sync", "Run sync/integration operations."],
] as const

const frameworkApps = [
  {
    id: "framework",
    name: "Framework",
    route: "/dashboard",
    summary: "Framework shell and runtime controls.",
  },
  ...appSuite.apps.map((app) => ({
    id: app.id,
    name: app.name,
    route: app.id === "billing" ? "/dashboard/billing" : `/dashboard/apps/${app.id}`,
    summary: app.description,
  })),
]

const frameworkResources = [
  createOption({
    category: "resource",
    key: "dashboard",
    label: "Application Desk",
    summary: "Primary desk landing surface.",
    appId: "framework",
    route: "/dashboard",
    scopeType: "desk",
  }),
  createOption({
    category: "resource",
    key: "admin",
    label: "Admin Desk",
    summary: "Administrative desk surface.",
    appId: "framework",
    route: "/dashboard/admin",
    scopeType: "desk",
  }),
  createOption({
    category: "resource",
    key: "media-manager",
    label: "Media Manager",
    summary: "Shared media manager.",
    appId: "framework",
    route: "/dashboard/media",
    scopeType: "page",
  }),
  createOption({
    category: "resource",
    key: "roles",
    label: "Roles",
    summary: "Framework role manager.",
    appId: "framework",
    route: "/dashboard/settings/roles",
    scopeType: "module",
  }),
  createOption({
    category: "resource",
    key: "permissions",
    label: "Permissions",
    summary: "Framework permission manager.",
    appId: "framework",
    route: "/dashboard/settings/permissions",
    scopeType: "module",
  }),
  createOption({
    category: "resource",
    key: "users",
    label: "Users",
    summary: "Framework user manager.",
    appId: "framework",
    route: "/dashboard/settings/users",
    scopeType: "module",
  }),
  createOption({
    category: "resource",
    key: "companies",
    label: "Companies",
    summary: "Framework company manager.",
    appId: "framework",
    route: "/dashboard/settings/companies",
    scopeType: "module",
  }),
  createOption({
    category: "resource",
    key: "core-settings",
    label: "Core Settings",
    summary: "Framework runtime settings.",
    appId: "framework",
    route: "/dashboard/settings/core-settings",
    scopeType: "workspace",
  }),
  createOption({
    category: "resource",
    key: "system-update",
    label: "System Update",
    summary: "Framework update controls.",
    appId: "framework",
    route: "/dashboard/system-update",
    scopeType: "page",
  }),
]

const workspaceModuleMap = new Map<string, Array<{ id: string; name: string; route: string; summary: string }>>([
  ["core", coreWorkspaceItems],
  ["billing", billingWorkspaceItems],
  ["ecommerce", ecommerceWorkspaceItems],
  ["frappe", frappeWorkspaceItems],
])

const appResources = frameworkApps.flatMap((app) => {
  const matchingSuiteApp = appSuite.apps.find((candidate) => candidate.id === app.id)

  if (!matchingSuiteApp) {
    return [
      createOption({
        category: "app",
        key: app.id,
        label: app.name,
        summary: app.summary,
        appId: app.id,
        route: app.route,
        scopeType: null,
      }),
    ]
  }

  const appOption = createOption({
    category: "app",
    key: app.id,
    label: app.name,
    summary: app.summary,
    appId: app.id,
    route: app.route,
    scopeType: null,
  })

  const moduleResources = [
    createOption({
      category: "resource",
      key: app.id,
      label: app.name,
      summary: `Whole ${app.name} workspace.`,
      appId: app.id,
      route: app.route,
      scopeType: "workspace",
    }),
    ...(workspaceModuleMap.get(app.id) ?? []).flatMap((module) => {
      const base = createOption({
        category: "resource",
        key: module.id,
        label: module.name,
        summary: module.summary,
        appId: app.id,
        route: module.route,
        scopeType: "module",
      })

      const page = createOption({
        ...base,
        scopeType: "page",
      })

      const maybeReport = /(report|statement|balance|profit|book|trial|outstanding|entry)/i.test(
        module.id
      )
        ? [
            createOption({
              ...base,
              scopeType: "report",
            }),
          ]
        : []

      return [base, page, ...maybeReport]
    }),
  ]

  return [appOption, ...moduleResources]
})

export const authOptionSeed: AppSettingOption[] = [
  ...actorTypes.map(([key, label, summary]) =>
    createOption({
      category: "actor-type",
      key,
      label,
      summary,
      appId: null,
      route: null,
      scopeType: null,
    })
  ),
  ...permissionScopeTypes.map(([key, label, summary]) =>
    createOption({
      category: "permission-scope-type",
      key,
      label,
      summary,
      appId: null,
      route: null,
      scopeType: null,
    })
  ),
  ...permissionActionTypes.map(([key, label, summary]) =>
    createOption({
      category: "permission-action-type",
      key,
      label,
      summary,
      appId: null,
      route: null,
      scopeType: null,
    })
  ),
  ...appResources,
  ...frameworkResources,
]
