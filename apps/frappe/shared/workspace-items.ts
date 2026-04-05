export interface FrappeWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const frappeWorkspaceItems: FrappeWorkspaceItem[] = [
  {
    id: "overview",
    name: "Frappe Overview",
    route: "/dashboard/apps/frappe",
    summary: "Connector workspace for ERPNext readiness, local snapshots, and rebuild-safe sync health.",
  },
  {
    id: "connection",
    name: "ERPNext Connection",
    route: "/dashboard/apps/frappe/connection",
    summary: "Manage connector settings, default mappings, and connection verification.",
  },
  {
    id: "todos",
    name: "ToDo",
    route: "/dashboard/apps/frappe/todos",
    summary: "Review and update app-owned Frappe ToDo snapshots for operator workflows.",
  },
  {
    id: "items",
    name: "Item Manager",
    route: "/dashboard/apps/frappe/items",
    summary: "Manage item snapshots and stage selected Frappe items for the future commerce rebuild.",
  },
  {
    id: "purchase-receipts",
    name: "Purchase Receipts",
    route: "/dashboard/apps/frappe/purchase-receipts",
    summary: "Review purchase receipt snapshots and sync linked items into local commerce records.",
  },
]
