export interface EcommerceWorkspaceItem {
  id: string
  name: string
  route: string
  summary: string
}

export const ecommerceWorkspaceItems: EcommerceWorkspaceItem[] = [
  {
    id: "overview",
    name: "Overview",
    route: "/dashboard/apps/ecommerce",
    summary: "Admin overview for the ecommerce app boundary, active storefront surface, and current delivery status.",
  },
  {
    id: "storefront",
    name: "Storefront",
    route: "/dashboard/apps/ecommerce/storefront",
    summary: "Landing page, catalog, PDP, cart, and track-order surface owned by the ecommerce app.",
  },
  {
    id: "home-slider",
    name: "Home Slider",
    route: "/dashboard/apps/ecommerce/home-slider",
    summary: "Hero-slider gradients, CTA tone, frame styling, and navigation treatment for the public storefront home page.",
  },
  {
    id: "products",
    name: "Products",
    route: "/dashboard/apps/ecommerce/products",
    summary: "Core product masters consumed by ecommerce for merchandising, PDP delivery, and checkout readiness.",
  },
  {
    id: "catalog",
    name: "Catalog",
    route: "/dashboard/apps/ecommerce/catalog",
    summary: "Shared core products consumed by ecommerce for live storefront discovery and merchandising.",
  },
  {
    id: "customers",
    name: "Customers",
    route: "/dashboard/apps/ecommerce/customers",
    summary: "Customer accounts, registration flow, core contact linkage, and portal access behavior.",
  },
  {
    id: "orders",
    name: "Orders",
    route: "/dashboard/apps/ecommerce/orders",
    summary: "Checkout-created orders, payment verification, tracking flow, and customer order history behavior.",
  },
  {
    id: "checkout",
    name: "Checkout",
    route: "/dashboard/apps/ecommerce/checkout",
    summary: "Cart, address capture, shipping logic, Razorpay handoff, and post-payment verification flow.",
  },
  {
    id: "settings",
    name: "Settings",
    route: "/dashboard/apps/ecommerce/settings",
    summary: "Storefront settings, shipping thresholds, payment readiness, and rebuild-safe ecommerce configuration.",
  },
]
