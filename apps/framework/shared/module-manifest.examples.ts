import {
  defineModuleManifest,
  type ModuleManifest,
} from "./module-manifest.js"

export const computerRetailIndustryPackManifest: ModuleManifest =
  defineModuleManifest({
    id: "computer-retail",
    type: "industry-pack",
    displayName: "Computer Retail",
    summary: "Industry pack for computer retail, counter sales, warranty-aware inventory, and service-led commerce operations.",
    dependencies: [
      { id: "commerce-app", kind: "app" },
      { id: "billing-app", kind: "app" },
      { id: "inventory-app", kind: "app", optional: true },
      { id: "document-engine", kind: "engine", optional: true },
    ],
    featureFlags: [
      {
        key: "computer-retail.repair-intake",
        label: "Repair Intake",
        summary: "Enable repair and service intake workflows for computer devices.",
        defaultEnabled: false,
        scope: "industry",
      },
    ],
    workspaceContributions: [
      {
        id: "computer-retail-workspace",
        type: "workspace",
        label: "Computer Retail",
        route: "/dashboard/apps/commerce",
        summary: "Retail-first workspace bundle for product sales, storefront operations, and billing.",
      },
      {
        id: "computer-retail-stock-report",
        type: "report",
        label: "Stock Alerts",
        appId: "billing",
        summary: "Industry default report for low-stock and reorder visibility.",
      },
    ],
    routeContributions: [],
    permissions: [
      "computer-retail:view",
      "computer-retail:manage",
    ],
    settings: [
      {
        key: "computerRetail.defaultWarrantyPolicy",
        label: "Default Warranty Policy",
        valueType: "string",
      },
    ],
    widgets: ["stock-alert-widget"],
    builders: ["retail-invoice-builder"],
    migrations: [],
    seeders: [],
  })

export const techmediaClientOverlayManifest: ModuleManifest = defineModuleManifest({
  id: "techmedia",
  type: "client-overlay",
  displayName: "Techmedia",
  summary: "Client overlay for Techmedia computer retail operations and branding.",
  dependencies: [
    { id: "computer-retail", kind: "industry-pack" },
    { id: "commerce-app", kind: "app" },
    { id: "billing-app", kind: "app" },
    { id: "codexsun-control-plane", kind: "orchestration", optional: true },
  ],
  featureFlags: [
    {
      key: "techmedia.show-repair-desk",
      label: "Show Repair Desk",
      summary: "Client-specific visibility for repair-intake operations.",
      defaultEnabled: true,
      scope: "client",
    },
  ],
  workspaceContributions: [
    {
      id: "techmedia-commerce-home",
      type: "page",
      label: "Techmedia Commerce",
      route: "/dashboard/apps/ecommerce",
      appId: "ecommerce",
      summary: "Client-tuned commerce landing route for Techmedia operators.",
      featureFlags: ["techmedia.show-repair-desk"],
    },
  ],
  routeContributions: [],
  permissions: [
    "techmedia:workspace:view",
  ],
  settings: [
    {
      key: "techmedia.branding.primaryCatalogTheme",
      label: "Primary Catalog Theme",
      valueType: "enum",
    },
  ],
  widgets: ["techmedia-brand-hero"],
  builders: ["techmedia-invoice-format"],
  migrations: [],
  seeders: [],
})
