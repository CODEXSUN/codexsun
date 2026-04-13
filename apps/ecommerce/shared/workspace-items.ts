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
    id: "history",
    name: "History",
    route: "/dashboard/apps/ecommerce/history",
    summary: "Live and draft storefront revision history across settings, home slider, footer, and campaign designer changes.",
  },
  {
    id: "home-slider",
    name: "Home Slider",
    route: "/dashboard/apps/ecommerce/home-slider",
    summary: "Hero-slider gradients, CTA tone, frame styling, and navigation treatment for the public storefront home page.",
  },
  {
    id: "campaign",
    name: "Campaign",
    route: "/dashboard/apps/ecommerce/campaign",
    summary: "Standalone campaign designer for the CTA card and trust cards shown together in the storefront campaign row.",
  },
  {
    id: "products",
    name: "Products",
    route: "/dashboard/apps/ecommerce/products",
    summary: "Core product masters consumed by ecommerce for merchandising, PDP delivery, and checkout readiness.",
  },
  {
    id: "customers",
    name: "Customers",
    route: "/dashboard/apps/ecommerce/customers",
    summary: "Customer accounts, registration flow, core contact linkage, and portal access behavior.",
  },
  {
    id: "support",
    name: "Support",
    route: "/dashboard/apps/ecommerce/support",
    summary: "Customer service queue linked to orders, case status updates, and portal-created support requests.",
  },
  {
    id: "communications",
    name: "Communications",
    route: "/dashboard/apps/ecommerce/communications",
    summary: "Storefront customer mail health, failed notification visibility, and resend tools for commerce communications.",
  },
  {
    id: "orders",
    name: "Orders",
    route: "/dashboard/apps/ecommerce/orders",
    summary: "Checkout-created orders, payment verification, tracking flow, and customer order history behavior.",
  },
  {
    id: "stock-purchase-receipts",
    name: "Purchase Receipts",
    route: "/dashboard/apps/ecommerce/stock-purchase-receipts",
    summary: "Create and review purchase receipts for inbound stock intake.",
  },
  {
    id: "stock-goods-inward",
    name: "Stock Entry",
    route: "/dashboard/apps/ecommerce/stock-goods-inward",
    summary: "Record stock entry, manufacturer identity, and posting readiness after receipt.",
  },
  {
    id: "stock-barcodes",
    name: "Generate Barcode",
    route: "/dashboard/apps/ecommerce/stock-barcodes",
    summary: "Generate stock stickers and review barcode-ready stock units.",
  },
  {
    id: "stock-outward",
    name: "Outward",
    route: "/dashboard/apps/ecommerce/stock-outward",
    summary: "Verify scans and issue stock into outward and sales flows.",
  },
  {
    id: "payments",
    name: "Payments",
    route: "/dashboard/apps/ecommerce/payments",
    summary: "Settlement visibility, failed-payment exceptions, webhook health, and manual reconciliation for ecommerce payments.",
  },
  {
    id: "checkout",
    name: "Checkout",
    route: "/dashboard/apps/ecommerce/checkout",
    summary: "Cart, address capture, shipping logic, Razorpay handoff, and post-payment verification flow.",
  },
  {
    id: "shipping",
    name: "Shipping",
    route: "/dashboard/apps/ecommerce/shipping",
    summary: "Global shipping and handling defaults used when product-level charges are not defined.",
  },
  {
    id: "footer",
    name: "Footer",
    route: "/dashboard/apps/ecommerce/footer",
    summary: "Standalone footer designer for footer copy, columns, and social links used on the public storefront.",
  },
  {
    id: "menu-editor",
    name: "Menu Editor",
    route: "/dashboard/apps/ecommerce/menu-editor",
    summary: "Standalone menu designer for logo position, logo size, and logo hover treatment across storefront top menu, footer, and app sidebar.",
  },
  {
    id: "floating-contact",
    name: "Floating Contact",
    route: "/dashboard/apps/ecommerce/floating-contact",
    summary: "Floating contact button designer for icon, labels, channels, and storefront contact styling.",
  },
  {
    id: "pickup",
    name: "Pickup",
    route: "/dashboard/apps/ecommerce/pickup",
    summary: "Standalone pickup designer for store-pickup availability, retail location details, and checkout pickup guidance.",
  },
  {
    id: "coupon-banner",
    name: "Coupon Banner",
    route: "/dashboard/apps/ecommerce/coupon-banner",
    summary: "Standalone coupon banner designer for promo copy, coupon code, CTA, and storefront color styling.",
  },
  {
    id: "gift-corner",
    name: "Gift Corner",
    route: "/dashboard/apps/ecommerce/gift-corner",
    summary: "Standalone gift-corner designer for gradient background, image, copy, and small CTA button styling.",
  },
  {
    id: "trending",
    name: "Trending",
    route: "/dashboard/apps/ecommerce/trending",
    summary: "Standalone trending-section designer for a lead card and linked trend cards with image and color styling.",
  },
  {
    id: "branding",
    name: "Branding",
    route: "/dashboard/apps/ecommerce/branding",
    summary: "Entry point that sends operators to the company logo editor where the public brand SVG is designed and published.",
  },
  {
    id: "settings",
    name: "Settings",
    route: "/dashboard/apps/ecommerce/settings",
    summary: "Storefront settings, shipping thresholds, payment readiness, and rebuild-safe ecommerce configuration.",
  },
]
