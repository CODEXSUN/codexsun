import { coreCommonModuleMenuItems } from "./common-module-navigation.js"

export interface CoreWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const coreWorkspaceItems: CoreWorkspaceItem[] = [
  {
    id: "overview",
    name: "Core Overview",
    route: "/dashboard/apps/core",
    summary: "Shared organization, master-data, and setup foundations.",
  },
  {
    id: "contacts",
    name: "Contacts",
    route: "/dashboard/apps/core/contacts",
    summary: "Shared contact and party management across the suite.",
  },
  {
    id: "products",
    name: "Products",
    route: "/dashboard/apps/core/products",
    summary: "Shared product and catalog item management across the suite.",
  },
  {
    id: "common-modules",
    name: "Common Modules",
    route: "/dashboard/apps/core/common-modules",
    summary: "Geography and reusable master data shared across apps.",
  },
  {
    id: "core-settings",
    name: "Core Settings",
    route: "/dashboard/apps/core/core-settings",
    summary: "Full runtime environment settings and cross-suite control surface.",
  },
  {
    id: "security-policy",
    name: "Security Policy",
    route: "/dashboard/apps/core/security-policy",
    summary: "HTTPS, secret rotation, login policy, and internal/admin access controls.",
  },
  {
    id: "observability-settings",
    name: "Observability",
    route: "/dashboard/apps/core/observability-settings",
    summary: "Structured logging, alert contacts, and monitoring thresholds.",
  },
  {
    id: "operations-governance",
    name: "Operations",
    route: "/dashboard/apps/core/operations-governance",
    summary: "Backup cadence, audit controls, and restore/security review checkpoints.",
  },
  ...coreCommonModuleMenuItems,
]
