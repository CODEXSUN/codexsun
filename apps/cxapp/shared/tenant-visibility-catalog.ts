export type TenantVisibilityModuleCatalogEntry = {
  id: string
  menuGroupId: string
  label: string
  route: string
  summary: string
}

export type TenantVisibilityAppCatalogEntry = {
  appId: string
  label: string
  route: string
  summary: string
  modules: TenantVisibilityModuleCatalogEntry[]
}

export const tenantVisibilityLegacyIndustryMap: Record<string, string> = {
  "garment-d2c": "garment-ecommerce",
  "textile-wholesale": "garments",
}

export const tenantVisibilityAppCatalog: TenantVisibilityAppCatalogEntry[] = [
  {
    appId: "core",
    label: "Core",
    route: "/dashboard/apps/core",
    summary: "Shared masters, contacts, products, and reusable common modules.",
    modules: [
      {
        id: "core.overview",
        menuGroupId: "core-overview",
        label: "Overview",
        route: "/dashboard/apps/core",
        summary: "Core workspace landing and shared master overview.",
      },
      {
        id: "core.master",
        menuGroupId: "core-foundation",
        label: "Master",
        route: "/dashboard/apps/core/contacts",
        summary: "Shared contacts and products maintained for every tenant bundle.",
      },
      {
        id: "core.common",
        menuGroupId: "core-common",
        label: "Common",
        route: "/dashboard/apps/core/common-modules",
        summary: "Common modules such as tax, units, warehouses, and addresses.",
      },
      {
        id: "core.settings",
        menuGroupId: "core-settings",
        label: "Core Settings",
        route: "/dashboard/apps/core/core-settings",
        summary: "Core settings, observability, and operations governance pages.",
      },
    ],
  },
  {
    appId: "billing",
    label: "Billing",
    route: "/dashboard/billing",
    summary: "Billing, accounts, vouchers, stock-facing billing flows, and reports.",
    modules: [
      {
        id: "billing.overview",
        menuGroupId: "billing-overview",
        label: "Overview",
        route: "/dashboard/billing",
        summary: "Billing workspace landing and operating summary.",
      },
      {
        id: "billing.system",
        menuGroupId: "billing-system",
        label: "System",
        route: "/dashboard/billing/categories",
        summary: "Ledger setup, categories, voucher groups, and voucher types.",
      },
      {
        id: "billing.books",
        menuGroupId: "billing-books",
        label: "Books",
        route: "/dashboard/billing/voucher-register",
        summary: "Voucher register and book-level browsing.",
      },
      {
        id: "billing.vouchers",
        menuGroupId: "billing-vouchers",
        label: "Vouchers",
        route: "/dashboard/billing/sales-vouchers",
        summary: "Sales, purchase, payment, receipt, and journal voucher workflows.",
      },
      {
        id: "billing.accounts",
        menuGroupId: "billing-accounts",
        label: "Accounts",
        route: "/dashboard/billing/contra-vouchers",
        summary: "Contra, credit note, debit note, and accounting adjustments.",
      },
      {
        id: "billing.inventory",
        menuGroupId: "billing-inventory",
        label: "Inventory",
        route: "/dashboard/billing/stock",
        summary: "Billing-side stock and inventory-linked billing surfaces.",
      },
      {
        id: "billing.reports",
        menuGroupId: "billing-reports",
        label: "Reports",
        route: "/dashboard/billing/statements",
        summary: "Statements, books, balances, and outstanding reports.",
      },
      {
        id: "billing.common",
        menuGroupId: "billing-common",
        label: "Common",
        route: "/dashboard/billing/common-productGroups",
        summary: "Shared master shortcuts embedded into the billing workspace.",
      },
    ],
  },
  {
    appId: "stock",
    label: "Stock",
    route: "/dashboard/apps/stock",
    summary: "Stock inward, outward, movement, reservation, and verification operations.",
    modules: [
      {
        id: "stock.overview",
        menuGroupId: "stock-overview",
        label: "Overview",
        route: "/dashboard/apps/stock",
        summary: "Stock workspace landing and live movement overview.",
      },
      {
        id: "stock.inward",
        menuGroupId: "stock-inward",
        label: "Inward",
        route: "/dashboard/apps/stock/purchase-receipts",
        summary: "Purchase receipt, inward posting, goods rejection, ledger, and verification surfaces.",
      },
      {
        id: "stock.outward",
        menuGroupId: "stock-outward",
        label: "Outward",
        route: "/dashboard/apps/stock/delivery-note",
        summary: "Delivery note and outward issue flows.",
      },
      {
        id: "stock.operations",
        menuGroupId: "stock-operations",
        label: "Operations",
        route: "/dashboard/apps/stock/sale-allocations",
        summary: "Sale allocations, movements, reconciliation, transfers, and reservations.",
      },
    ],
  },
  {
    appId: "ecommerce",
    label: "Ecommerce",
    route: "/dashboard/apps/ecommerce",
    summary: "Storefront design, checkout, orders, payments, support, and commerce operations.",
    modules: [
      {
        id: "ecommerce.overview",
        menuGroupId: "ecommerce-overview",
        label: "Overview",
        route: "/dashboard/apps/ecommerce",
        summary: "Ecommerce workspace landing and commerce overview.",
      },
      {
        id: "ecommerce.storefront",
        menuGroupId: "ecommerce-storefront",
        label: "Storefront",
        route: "/dashboard/apps/ecommerce/storefront",
        summary: "Storefront design, menu, footer, campaign, and merchandising surfaces.",
      },
      {
        id: "ecommerce.commerce",
        menuGroupId: "ecommerce-commerce",
        label: "Commerce",
        route: "/dashboard/apps/ecommerce/products",
        summary: "Products, checkout, and commercial configuration surfaces.",
      },
      {
        id: "ecommerce.operations",
        menuGroupId: "ecommerce-operations",
        label: "Operations",
        route: "/dashboard/apps/ecommerce/orders",
        summary: "Customers, support, communications, orders, and payments.",
      },
      {
        id: "ecommerce.stock",
        menuGroupId: "ecommerce-stock",
        label: "Stock",
        route: "/dashboard/apps/ecommerce/stock-purchase-receipts",
        summary: "Commerce-side stock coordination and inward visibility.",
      },
      {
        id: "ecommerce.settings",
        menuGroupId: "ecommerce-settings",
        label: "Settings",
        route: "/dashboard/apps/ecommerce/settings",
        summary: "Shipping, storefront settings, and runtime commerce configuration.",
      },
      {
        id: "ecommerce.common",
        menuGroupId: "ecommerce-common",
        label: "Common",
        route: "/dashboard/apps/ecommerce/common-productGroups",
        summary: "Shared product-related common modules surfaced inside ecommerce.",
      },
    ],
  },
  {
    appId: "crm",
    label: "CRM",
    route: "/dashboard/apps/crm",
    summary: "Lead capture, cold calls, and sales orchestration support.",
    modules: [
      {
        id: "crm.overview",
        menuGroupId: "crm-overview",
        label: "Overview",
        route: "/dashboard/apps/crm",
        summary: "CRM workspace landing and lead overview.",
      },
      {
        id: "crm.sales",
        menuGroupId: "crm-sales",
        label: "Sales",
        route: "/dashboard/apps/crm/leads",
        summary: "Lead and cold-call workflow surfaces.",
      },
    ],
  },
  {
    appId: "frappe",
    label: "Frappe",
    route: "/dashboard/apps/frappe",
    summary: "ERPNext connector settings, snapshots, and sync orchestration.",
    modules: [
      {
        id: "frappe.connector",
        menuGroupId: "frappe-connector",
        label: "Connector",
        route: "/dashboard/apps/frappe/connection",
        summary: "Connector setup, todos, items, and purchase receipt sync visibility.",
      },
      {
        id: "frappe.workspace",
        menuGroupId: "frappe-workspace",
        label: "Workspace",
        route: "/dashboard/apps/frappe/backend",
        summary: "Technical workspace structure pages for the Frappe app boundary.",
      },
    ],
  },
]

export const tenantVisibilityDefaultAppIds = tenantVisibilityAppCatalog.map((app) => app.appId)

export const tenantVisibilityDefaultModuleIds = tenantVisibilityAppCatalog.flatMap(
  (app) => app.modules.map((module) => module.id)
)

const menuGroupVisibilityKeyMap = new Map(
  tenantVisibilityAppCatalog.flatMap((app) =>
    app.modules.map((module) => [module.menuGroupId, module.id] as const)
  )
)

const appCatalogMap = new Map(
  tenantVisibilityAppCatalog.map((item) => [item.appId, item] as const)
)

const moduleCatalogMap = new Map(
  tenantVisibilityAppCatalog.flatMap((app) =>
    app.modules.map((module) => [module.id, module] as const)
  )
)

export function normalizeTenantIndustryId(industryId: string | null | undefined) {
  if (!industryId) {
    return "garments"
  }

  return tenantVisibilityLegacyIndustryMap[industryId] ?? industryId
}

export function getTenantVisibilityAppCatalogEntry(appId: string) {
  return appCatalogMap.get(appId) ?? null
}

export function getTenantVisibilityModuleCatalogEntry(moduleId: string) {
  return moduleCatalogMap.get(moduleId) ?? null
}

export function getTenantVisibilityKeyForMenuGroup(menuGroupId: string) {
  const exactMatch = menuGroupVisibilityKeyMap.get(menuGroupId)

  if (exactMatch) {
    return exactMatch
  }

  if (menuGroupId.startsWith("billing-")) {
    return "billing.common"
  }

  return null
}
