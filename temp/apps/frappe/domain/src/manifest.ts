export interface FrappeWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const frappeWorkspaceItems: FrappeWorkspaceItem[] = [
  {
    id: 'overview',
    name: 'Frappe Overview',
    route: '/admin/dashboard/frappe',
    summary: 'Integration workspace for ERPNext connection, defaults, and rollout readiness.',
  },
  {
    id: 'connection',
    name: 'ERPNext Connection',
    route: '/admin/dashboard/frappe/connection',
    summary: 'Configure ERPNext URL, API credentials, and default master mappings.',
  },
  {
    id: 'todos',
    name: 'ToDo',
    route: '/admin/dashboard/frappe/todos',
    summary: 'Create, update, and live-sync ERPNext ToDo records from the Frappe workspace.',
  },
  {
    id: 'items',
    name: 'Item Manager',
    route: '/admin/dashboard/frappe/items',
    summary: 'Sync ERPNext Item masters, manage dependencies, and create or update inventory records.',
  },
  {
    id: 'purchase-receipts',
    name: 'Purchase Receipts',
    route: '/admin/dashboard/frappe/purchase-receipts',
    summary: 'Review ERPNext Purchase Receipts, linked items, and sync them into local purchase snapshots.',
  },
]
