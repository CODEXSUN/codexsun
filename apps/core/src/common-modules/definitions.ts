import type {
  CommonModuleKey,
  CommonModuleMetadata,
  CommonModuleMetadataColumn,
} from "../../shared/index.js"

import { commonModuleTableNames } from "../../database/table-names.js"

type CommonModuleColumnDefinition = CommonModuleMetadataColumn & {
  numberMode?: "integer" | "decimal"
}

export type CommonModuleDefinition = {
  key: CommonModuleKey
  label: string
  tableName: string
  defaultSortKey: string
  columns: readonly CommonModuleColumnDefinition[]
}

export const commonModuleDefinitions = [
  {
    key: "countries",
    label: "Countries",
    tableName: commonModuleTableNames.countries,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "phone_code", label: "Phone Code", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "states",
    label: "States",
    tableName: commonModuleTableNames.states,
    defaultSortKey: "name",
    columns: [
      { key: "country_id", label: "Country", type: "string", required: true, nullable: false, referenceModule: "countries" },
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
    ],
  },
  {
    key: "districts",
    label: "Districts",
    tableName: commonModuleTableNames.districts,
    defaultSortKey: "name",
    columns: [
      { key: "state_id", label: "State", type: "string", required: true, nullable: false, referenceModule: "states" },
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
    ],
  },
  {
    key: "cities",
    label: "Cities",
    tableName: commonModuleTableNames.cities,
    defaultSortKey: "name",
    columns: [
      { key: "state_id", label: "State", type: "string", required: true, nullable: false, referenceModule: "states" },
      { key: "district_id", label: "District", type: "string", required: true, nullable: false, referenceModule: "districts" },
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
    ],
  },
  {
    key: "pincodes",
    label: "Pincodes",
    tableName: commonModuleTableNames.pincodes,
    defaultSortKey: "code",
    columns: [
      { key: "country_id", label: "Country", type: "string", required: true, nullable: false, referenceModule: "countries" },
      { key: "state_id", label: "State", type: "string", required: true, nullable: false, referenceModule: "states" },
      { key: "district_id", label: "District", type: "string", required: true, nullable: false, referenceModule: "districts" },
      { key: "city_id", label: "City", type: "string", required: true, nullable: false, referenceModule: "cities" },
      { key: "code", label: "Pincode", type: "string", required: true, nullable: false },
      { key: "area_name", label: "Area Name", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "contactGroups",
    label: "Contact Groups",
    tableName: commonModuleTableNames.contactGroups,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "contactTypes",
    label: "Contact Types",
    tableName: commonModuleTableNames.contactTypes,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "addressTypes",
    label: "Address Types",
    tableName: commonModuleTableNames.addressTypes,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "productGroups",
    label: "Product Groups",
    tableName: commonModuleTableNames.productGroups,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "productCategories",
    label: "Product Categories",
    tableName: commonModuleTableNames.productCategories,
    defaultSortKey: "position_order",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
      { key: "image", label: "Image", type: "string", required: false, nullable: true },
      { key: "position_order", label: "Position Order", type: "number", numberMode: "integer", required: false, nullable: false },
      { key: "show_on_storefront_top_menu", label: "Show On Storefront Top Menu", type: "boolean", required: false, nullable: false },
      { key: "show_on_storefront_catalog", label: "Show On Storefront Catalog", type: "boolean", required: false, nullable: false },
    ],
  },
  {
    key: "productTypes",
    label: "Product Types",
    tableName: commonModuleTableNames.productTypes,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "units",
    label: "Units",
    tableName: commonModuleTableNames.units,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "symbol", label: "Symbol", type: "string", required: false, nullable: true },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "hsnCodes",
    label: "HSN Codes",
    tableName: commonModuleTableNames.hsnCodes,
    defaultSortKey: "code",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: true, nullable: false },
    ],
  },
  {
    key: "taxes",
    label: "Taxes",
    tableName: commonModuleTableNames.taxes,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "tax_type", label: "Tax Type", type: "string", required: true, nullable: false },
      { key: "rate_percent", label: "Rate Percent", type: "number", numberMode: "decimal", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "brands",
    label: "Brands",
    tableName: commonModuleTableNames.brands,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "colours",
    label: "Colours",
    tableName: commonModuleTableNames.colours,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "hex_code", label: "Hex Code", type: "string", required: false, nullable: true },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "sizes",
    label: "Sizes",
    tableName: commonModuleTableNames.sizes,
    defaultSortKey: "sort_order",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "sort_order", label: "Sort Order", type: "number", numberMode: "integer", required: false, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "currencies",
    label: "Currencies",
    tableName: commonModuleTableNames.currencies,
    defaultSortKey: "code",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "symbol", label: "Symbol", type: "string", required: true, nullable: false },
      { key: "decimal_places", label: "Decimal Places", type: "number", numberMode: "integer", required: false, nullable: false },
    ],
  },
  {
    key: "orderTypes",
    label: "Order Types",
    tableName: commonModuleTableNames.orderTypes,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "styles",
    label: "Styles",
    tableName: commonModuleTableNames.styles,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "transports",
    label: "Transports",
    tableName: commonModuleTableNames.transports,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "warehouses",
    label: "Warehouses",
    tableName: commonModuleTableNames.warehouses,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "country_id", label: "Country", type: "string", required: false, nullable: true, referenceModule: "countries" },
      { key: "state_id", label: "State", type: "string", required: false, nullable: true, referenceModule: "states" },
      { key: "district_id", label: "District", type: "string", required: false, nullable: true, referenceModule: "districts" },
      { key: "city_id", label: "City", type: "string", required: false, nullable: true, referenceModule: "cities" },
      { key: "pincode_id", label: "Pincode", type: "string", required: false, nullable: true, referenceModule: "pincodes" },
      { key: "address_line1", label: "Address Line 1", type: "string", required: false, nullable: true },
      { key: "address_line2", label: "Address Line 2", type: "string", required: false, nullable: true },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "destinations",
    label: "Destinations",
    tableName: commonModuleTableNames.destinations,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "paymentTerms",
    label: "Payment Terms",
    tableName: commonModuleTableNames.paymentTerms,
    defaultSortKey: "name",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "due_days", label: "Due Days", type: "number", numberMode: "integer", required: false, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "storefrontTemplates",
    label: "Storefront Design Templates",
    tableName: commonModuleTableNames.storefrontTemplates,
    defaultSortKey: "sort_order",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "sort_order", label: "Sort Order", type: "number", numberMode: "integer", required: false, nullable: false },
      { key: "badge_text", label: "Badge", type: "string", required: false, nullable: true },
      { key: "title", label: "Title", type: "string", required: true, nullable: false },
      { key: "description", label: "Description", type: "string", required: false, nullable: true },
      { key: "cta_primary_label", label: "Primary CTA Label", type: "string", required: false, nullable: true },
      { key: "cta_primary_href", label: "Primary CTA Href", type: "string", required: false, nullable: true },
      { key: "cta_secondary_label", label: "Secondary CTA Label", type: "string", required: false, nullable: true },
      { key: "cta_secondary_href", label: "Secondary CTA Href", type: "string", required: false, nullable: true },
      { key: "icon_key", label: "Icon Key", type: "string", required: false, nullable: true },
      { key: "theme_key", label: "Theme Key", type: "string", required: false, nullable: true },
    ],
  },
  {
    key: "sliderThemes",
    label: "Slider Themes",
    tableName: commonModuleTableNames.sliderThemes,
    defaultSortKey: "sort_order",
    columns: [
      { key: "code", label: "Code", type: "string", required: true, nullable: false },
      { key: "name", label: "Name", type: "string", required: true, nullable: false },
      { key: "sort_order", label: "Sort Order", type: "number", numberMode: "integer", required: false, nullable: false },
      { key: "add_to_cart_label", label: "Add To Cart Label", type: "string", required: false, nullable: true },
      { key: "view_details_label", label: "View Details Label", type: "string", required: false, nullable: true },
      { key: "background_from", label: "Background From", type: "string", required: true, nullable: false },
      { key: "background_via", label: "Background Via", type: "string", required: true, nullable: false },
      { key: "background_to", label: "Background To", type: "string", required: true, nullable: false },
      { key: "text_color", label: "Text Color", type: "string", required: false, nullable: true },
      { key: "muted_text_color", label: "Muted Text Color", type: "string", required: false, nullable: true },
      { key: "badge_background", label: "Badge Background", type: "string", required: false, nullable: true },
      { key: "badge_text_color", label: "Badge Text Color", type: "string", required: false, nullable: true },
      { key: "primary_button_background", label: "Primary Button Background", type: "string", required: false, nullable: true },
      { key: "primary_button_text_color", label: "Primary Button Text", type: "string", required: false, nullable: true },
      { key: "secondary_button_background", label: "Secondary Button Background", type: "string", required: false, nullable: true },
      { key: "secondary_button_text_color", label: "Secondary Button Text", type: "string", required: false, nullable: true },
      { key: "nav_background", label: "Nav Background", type: "string", required: false, nullable: true },
      { key: "nav_text_color", label: "Nav Text Color", type: "string", required: false, nullable: true },
    ],
  },
] as const satisfies readonly CommonModuleDefinition[]

const commonModuleDefinitionByKey = Object.fromEntries(
  commonModuleDefinitions.map((definition) => [definition.key, definition])
) as unknown as Record<CommonModuleKey, CommonModuleDefinition>

export function listCommonModuleDefinitions() {
  return [...commonModuleDefinitions]
}

export function getCommonModuleDefinition(key: CommonModuleKey) {
  return commonModuleDefinitionByKey[key]
}

export function toCommonModuleMetadata(definition: CommonModuleDefinition): CommonModuleMetadata {
  return {
    key: definition.key,
    label: definition.label,
    defaultSortKey: definition.defaultSortKey,
    columns: [...definition.columns],
  }
}
