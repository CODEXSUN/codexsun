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
    id: "companies",
    name: "Companies",
    route: "/dashboard/apps/core/companies",
    summary: "Company-level setup and organization records.",
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
  ...coreCommonModuleMenuItems,
  {
    id: "setup",
    name: "Setup",
    route: "/dashboard/apps/core/setup",
    summary: "Bootstrap and readiness foundations for first-run delivery.",
  },
  {
    id: "core-settings",
    name: "Core Settings",
    route: "/dashboard/apps/core/core-settings",
    summary: "Core app defaults and shared operational guardrails.",
  },
]
