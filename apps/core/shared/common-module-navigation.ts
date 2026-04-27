import type { CommonModuleKey } from "./schemas/common-modules.js"

export type CoreCommonModuleMenuItem = {
  id: string
  key: CommonModuleKey
  name: string
  route: string
  summary: string
}

export type CoreCommonModuleMenuGroup = {
  id: string
  label: string
  items: CoreCommonModuleMenuItem[]
}

function defineCommonModuleItem(
  key: CommonModuleKey,
  name: string,
  summary: string
): CoreCommonModuleMenuItem {
  return {
    id: `common-${key}`,
    key,
    name,
    route: `/dashboard/apps/core/common-${key}`,
    summary,
  }
}

export const coreCommonModuleMenuGroups: CoreCommonModuleMenuGroup[] = [
  {
    id: "location",
    label: "Location",
    items: [
      defineCommonModuleItem("countries", "Countries", "Country master and dialing defaults."),
      defineCommonModuleItem("states", "States", "State and province definitions."),
      defineCommonModuleItem("districts", "Districts", "District classification under states."),
      defineCommonModuleItem("cities", "Cities", "City-level operating locations."),
      defineCommonModuleItem("pincodes", "Pincodes", "Postal code and delivery areas."),
    ],
  },
  {
    id: "contacts",
    label: "Contacts",
    items: [
      defineCommonModuleItem("contactGroups", "Contact Groups", "Contact segmentation for customers, vendors, and partners."),
      defineCommonModuleItem("contactTypes", "Contact Types", "Contact roles and identity types."),
      defineCommonModuleItem("addressTypes", "Address Types", "Reusable address-book types like billing, shipping, office, and branch."),
      defineCommonModuleItem("bankNames", "Bank Names", "Reusable bank master for finance forms and banking details."),
    ],
  },
  {
    id: "product",
    label: "Product",
    items: [
      defineCommonModuleItem("productGroups", "Product Groups", "Top-level product grouping."),
      defineCommonModuleItem("productCategories", "Product Categories", "Sell-side category classification."),
      defineCommonModuleItem("productTypes", "Product Types", "Stock, service, and bundle type definitions."),
      defineCommonModuleItem("brands", "Brands", "Brand master used across catalog and procurement."),
      defineCommonModuleItem("colours", "Colours", "Colour names and visual references."),
      defineCommonModuleItem("sizes", "Sizes", "Size values and sort order."),
      defineCommonModuleItem("styles", "Styles", "Style and assortment classification."),
      defineCommonModuleItem("units", "Units", "Quantity and measurement units."),
      defineCommonModuleItem("hsnCodes", "HSN Codes", "Tax classification for products."),
      defineCommonModuleItem("taxes", "Taxes", "Tax slabs and rate configuration."),
    ],
  },
  {
    id: "order",
    label: "Order",
    items: [
      defineCommonModuleItem("warehouses", "Warehouses", "Warehouse and stock location records."),
      defineCommonModuleItem("transports", "Transports", "Transport method master."),
      defineCommonModuleItem("destinations", "Destinations", "Shipping and movement destination types."),
      defineCommonModuleItem("orderTypes", "Order Types", "Order flow types across buying and selling."),
      defineCommonModuleItem("stockRejectionTypes", "Stock Rejection Types", "Reusable rejection classifications for stock inward checks."),
    ],
  },
  {
    id: "others",
    label: "Others",
    items: [
      defineCommonModuleItem("currencies", "Currencies", "Currency code and symbol defaults."),
      defineCommonModuleItem("paymentTerms", "Payment Terms", "Payment due-day rules for trade flows."),
      defineCommonModuleItem("storefrontTemplates", "Storefront Templates", "Home-page copy and CTA template content for storefront delivery."),
      defineCommonModuleItem("sliderThemes", "Slider Themes", "Hero-slider gradients, CTA labels, and navigation styling."),
    ],
  },
]

export const coreCommonModuleMenuItems = coreCommonModuleMenuGroups.flatMap(
  (group) => group.items
)

const coreCommonModuleItemById = Object.fromEntries(
  coreCommonModuleMenuItems.map((item) => [item.id, item])
) as Record<string, CoreCommonModuleMenuItem>

export function getCoreCommonModuleMenuItem(sectionId: string) {
  return coreCommonModuleItemById[sectionId] ?? null
}
