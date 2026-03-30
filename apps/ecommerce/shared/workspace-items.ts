export interface EcommerceWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const ecommerceWorkspaceItems: EcommerceWorkspaceItem[] = [
  {
    id: "overview",
    name: "Commerce Overview",
    route: "/dashboard/apps/ecommerce",
    summary: "Catalog, storefront, customer, and order operations in one workspace.",
  },
  {
    id: "catalog",
    name: "Catalog",
    route: "/dashboard/apps/ecommerce/catalog",
    summary: "Product publishing, assortment health, and storefront-ready inventory.",
  },
  {
    id: "storefront",
    name: "Storefront",
    route: "/dashboard/apps/ecommerce/storefront",
    summary: "Public catalog preview, category storytelling, and featured merchandising.",
  },
  {
    id: "orders",
    name: "Orders",
    route: "/dashboard/apps/ecommerce/orders",
    summary: "Commerce workflows, shipment progress, and invoice visibility.",
  },
  {
    id: "customers",
    name: "Customers",
    route: "/dashboard/apps/ecommerce/customers",
    summary: "Customer profiles, delivery addresses, and helpdesk issue review.",
  },
  {
    id: "settings",
    name: "Settings",
    route: "/dashboard/apps/ecommerce/settings",
    summary: "Pricing defaults and storefront dependency readiness.",
  },
]
