export interface DemoWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const demoWorkspaceItems: DemoWorkspaceItem[] = [
  {
    id: "overview",
    name: "Overview",
    route: "/dashboard/apps/demo",
    summary: "Demo-data control room for installing default or richer demo records into the current suite.",
  },
  {
    id: "install",
    name: "Install",
    route: "/dashboard/apps/demo/install",
    summary: "Choose the default or demo profile and install real seed data into the registered business modules.",
  },
  {
    id: "companies",
    name: "Companies",
    route: "/dashboard/apps/demo/companies",
    summary: "Suite company records available for demos, trial tenants, and operator walkthroughs.",
  },
  {
    id: "common",
    name: "Common",
    route: "/dashboard/apps/demo/common",
    summary: "Shared core common-module masters reused by commerce, billing, and operational workflows.",
  },
  {
    id: "contacts",
    name: "Contacts",
    route: "/dashboard/apps/demo/contacts",
    summary: "Shared contact masters used by customer, supplier, and logistics records.",
  },
  {
    id: "products",
    name: "Products",
    route: "/dashboard/apps/demo/products",
    summary: "Shared core product masters that power storefront, billing, and downstream operational flows.",
  },
  {
    id: "categories",
    name: "Categories",
    route: "/dashboard/apps/demo/categories",
    summary: "Storefront-facing product category masters and top-menu category inventory from core.",
  },
  {
    id: "customers",
    name: "Customers",
    route: "/dashboard/apps/demo/customers",
    summary: "Ecommerce-owned customer accounts and contact-linked registration records for demos and QA.",
  },
  {
    id: "orders",
    name: "Orders",
    route: "/dashboard/apps/demo/orders",
    summary: "Ecommerce-owned storefront orders seeded for checkout, tracking, and portal demonstrations.",
  },
  {
    id: "billing",
    name: "Billing",
    route: "/dashboard/apps/demo/billing",
    summary: "Billing masters and voucher records available for accounting walkthroughs.",
  },
  {
    id: "frappe",
    name: "Frappe",
    route: "/dashboard/apps/demo/frappe",
    summary: "ERP connector sample settings, todos, items, receipts, and sync logs.",
  },
]
