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
  ...coreCommonModuleMenuItems,
]
