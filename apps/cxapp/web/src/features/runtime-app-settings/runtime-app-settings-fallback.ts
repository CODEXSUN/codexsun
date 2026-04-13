import type {
  AppSettingOption,
  AppSettingsSnapshot,
} from "../../../../../framework/shared/index.js"

function defineOption(input: AppSettingOption): AppSettingOption {
  return input
}

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
  ["sync", "Sync", "Run sync or integration operations."],
] as const

const apps = [
  ["framework", "Framework", "/dashboard", "Framework shell and runtime controls."],
  ["core", "Core", "/dashboard/apps/core", "Core business masters and shared common modules."],
  ["billing", "Billing", "/dashboard/billing", "Billing operations and accounting workspace."],
  ["ecommerce", "Ecommerce", "/dashboard/apps/ecommerce", "Storefront and commerce workspace."],
  ["frappe", "Frappe", "/dashboard/apps/frappe", "Frappe connector workspace."],
  ["demo", "Demo", "/dashboard/apps/demo", "Demo data installer and sample workspace."],
  ["ui", "UI", "/dashboard/apps/ui", "Design system and reusable block workspace."],
] as const

const resources = [
  ["dashboard", "Application Desk", "framework", "/dashboard", "desk", "Primary desk landing surface."],
  ["admin", "Admin Desk", "framework", "/admin/dashboard", "desk", "Administrative desk surface."],
  ["media-manager", "Media Manager", "framework", "/dashboard/media", "page", "Shared media manager."],
  ["mail-service", "Mail Service", "framework", "/dashboard/mail-service", "page", "Shared outbound mail templates and delivery history."],
  ["mail-settings", "Mail Settings", "framework", "/dashboard/settings/mail-settings", "page", "Framework SMTP transport and sender identity settings saved to runtime .env."],
  ["users", "Users", "framework", "/dashboard/settings/users", "module", "Framework user manager."],
  ["roles", "Roles", "framework", "/dashboard/settings/roles", "module", "Framework role manager."],
  ["permissions", "Permissions", "framework", "/dashboard/settings/permissions", "module", "Framework permission manager."],
  ["companies", "Companies", "framework", "/dashboard/settings/companies", "module", "Framework company manager."],
  ["core-settings", "Core Settings", "framework", "/dashboard/settings/core-settings", "workspace", "Framework runtime settings."],
  ["developer-settings", "Developer Settings", "framework", "/dashboard/settings/developer-settings", "workspace", "Framework developer toggles, technical naming helpers, and frontend build recovery controls."],
  ["activity-log", "Activity Log", "framework", "/dashboard/settings/activity-log", "page", "Framework audit and admin activity ledger."],
  ["alerts-dashboard", "Alerts Dashboard", "framework", "/dashboard/settings/alerts-dashboard", "page", "Framework monitoring and alert coverage dashboard."],
  ["data-backup", "Data Backup", "framework", "/dashboard/settings/data-backup", "page", "Framework backup cadence, retention, restore drill, and off-machine archive controls."],
  ["queue-manager", "Queue Manager", "framework", "/dashboard/settings/queue-manager", "page", "Framework background-job queue, retries, worker pickup, and execution log dashboard."],
  ["security-review", "Security Review", "framework", "/dashboard/settings/security-review", "page", "Framework OWASP-aligned checklist and review signoff history."],
  ["system-update", "System Update", "framework", "/dashboard/system-update", "page", "Framework update controls."],
  ["hosted-apps", "Hosted Apps", "framework", "/dashboard/hosted-apps", "page", "Live hosted app status and clean software update controls."],
  ["live-servers", "Live Servers", "framework", "/dashboard/live-servers", "page", "Super-admin server fleet status and remote live config checks."],
  ["core", "Core Workspace", "core", "/dashboard/apps/core", "workspace", "Whole core workspace."],
  ["billing", "Billing Workspace", "billing", "/dashboard/billing", "workspace", "Whole billing workspace."],
  ["ecommerce", "Ecommerce Workspace", "ecommerce", "/dashboard/apps/ecommerce", "workspace", "Whole ecommerce workspace."],
  ["frappe", "Frappe Workspace", "frappe", "/dashboard/apps/frappe", "workspace", "Whole frappe workspace."],
  ["demo", "Demo Workspace", "demo", "/dashboard/apps/demo", "workspace", "Whole demo workspace."],
  ["ui", "UI Workspace", "ui", "/dashboard/apps/ui", "workspace", "Whole UI workspace."],
] as const

export const fallbackRuntimeAppSettings: AppSettingsSnapshot = {
  loadedAt: "fallback",
  authMetadata: {
    actorTypes: actorTypes.map(([key, label, summary]) =>
      defineOption({
        category: "actor-type",
        key,
        label,
        summary,
        appId: null,
        route: null,
        scopeType: null,
      })
    ),
    permissionScopeTypes: permissionScopeTypes.map(([key, label, summary]) =>
      defineOption({
        category: "permission-scope-type",
        key,
        label,
        summary,
        appId: null,
        route: null,
        scopeType: null,
      })
    ),
    permissionActionTypes: permissionActionTypes.map(([key, label, summary]) =>
      defineOption({
        category: "permission-action-type",
        key,
        label,
        summary,
        appId: null,
        route: null,
        scopeType: null,
      })
    ),
    apps: apps.map(([key, label, route, summary]) =>
      defineOption({
        category: "app",
        key,
        label,
        summary,
        appId: key,
        route,
        scopeType: null,
      })
    ),
    resources: resources.map(([key, label, appId, route, scopeType, summary]) =>
      defineOption({
        category: "resource",
        key,
        label,
        summary,
        appId,
        route,
        scopeType,
      })
    ),
  },
  uiFeedback: {
    toast: {
      position: "top-right",
      tone: "soft",
    },
  },
  uiDeveloperTools: {
    showTechnicalNames: false,
  },
}
