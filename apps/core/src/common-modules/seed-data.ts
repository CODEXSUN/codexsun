import type { CommonModuleItem, CommonModuleKey } from "../../shared/index.js"

import { catalogSeed } from "./seeds/catalog-seed.js"
import { defaultRecordId, defineItem } from "./seeds/helpers.js"
import { locationSeed } from "./seeds/location-seed.js"
import { masterSeed } from "./seeds/master-seed.js"
import { operationsSeed } from "./seeds/operations-seed.js"

const baseCommonModuleItemsByKey: Record<CommonModuleKey, CommonModuleItem[]> = {
  countries: locationSeed.countries ?? [],
  states: locationSeed.states ?? [],
  districts: locationSeed.districts ?? [],
  cities: locationSeed.cities ?? [],
  pincodes: locationSeed.pincodes ?? [],
  contactGroups: masterSeed.contactGroups ?? [],
  contactTypes: masterSeed.contactTypes ?? [],
  addressTypes: masterSeed.addressTypes ?? [],
  bankNames: masterSeed.bankNames ?? [],
  productGroups: catalogSeed.productGroups ?? [],
  productCategories: catalogSeed.productCategories ?? [],
  productTypes: catalogSeed.productTypes ?? [],
  units: catalogSeed.units ?? [],
  hsnCodes: catalogSeed.hsnCodes ?? [],
  taxes: catalogSeed.taxes ?? [],
  brands: catalogSeed.brands ?? [],
  colours: catalogSeed.colours ?? [],
  sizes: catalogSeed.sizes ?? [],
  currencies: masterSeed.currencies ?? [],
  orderTypes: catalogSeed.orderTypes ?? [],
  styles: catalogSeed.styles ?? [],
  transports: masterSeed.transports ?? [],
  warehouses: operationsSeed.warehouses ?? [],
  destinations: masterSeed.destinations ?? [],
  paymentTerms: masterSeed.paymentTerms ?? [],
  storefrontTemplates: operationsSeed.storefrontTemplates ?? [],
  sliderThemes: operationsSeed.sliderThemes ?? [],
}

const defaultCommonModuleRows: Record<
  CommonModuleKey,
  Record<string, string | number | boolean | null>
> = {
  countries: { code: "-", name: "-", phone_code: "-" },
  states: { country_id: defaultRecordId, code: "-", name: "-" },
  districts: { state_id: defaultRecordId, code: "-", name: "-" },
  cities: { state_id: defaultRecordId, district_id: defaultRecordId, code: "-", name: "-" },
  pincodes: {
    country_id: defaultRecordId,
    state_id: defaultRecordId,
    district_id: defaultRecordId,
    city_id: defaultRecordId,
    code: "-",
    area_name: "-",
  },
  contactGroups: { code: "-", name: "-", description: "-" },
  contactTypes: { code: "-", name: "-", description: "-" },
  addressTypes: { code: "-", name: "-", description: "-" },
  bankNames: { code: "-", name: "-", description: "-" },
  productGroups: { code: "-", name: "-", description: "-" },
  productCategories: {
    code: "-",
    name: "-",
    description: "-",
    image: "-",
    position_order: 0,
    show_on_storefront_top_menu: false,
    show_on_storefront_catalog: false,
  },
  productTypes: { code: "-", name: "-", description: "-" },
  units: { code: "-", name: "-", symbol: "-", description: "-" },
  hsnCodes: { code: "-", name: "-", description: "-" },
  taxes: { code: "-", name: "-", tax_type: "-", rate_percent: 0, description: "-" },
  brands: { code: "-", name: "-", description: "-" },
  colours: { code: "-", name: "-", hex_code: "-", description: "-" },
  sizes: { code: "-", name: "-", sort_order: 0, description: "-" },
  currencies: { code: "-", name: "-", symbol: "-", decimal_places: 0 },
  orderTypes: { code: "-", name: "-", description: "-" },
  styles: { code: "-", name: "-", description: "-" },
  transports: { code: "-", name: "-", description: "-" },
  warehouses: {
    code: "-",
    name: "-",
    is_default_location: false,
    country_id: defaultRecordId,
    state_id: defaultRecordId,
    district_id: defaultRecordId,
    city_id: defaultRecordId,
    pincode_id: defaultRecordId,
    address_line1: "-",
    address_line2: "-",
    description: "-",
  },
  destinations: { code: "-", name: "-", description: "-" },
  paymentTerms: { code: "-", name: "-", due_days: 0, description: "-" },
  storefrontTemplates: {
    code: "-",
    name: "-",
    sort_order: 0,
    badge_text: "-",
    title: "-",
    description: "-",
    cta_primary_label: "-",
    cta_primary_href: "-",
    cta_secondary_label: "-",
    cta_secondary_href: "-",
    icon_key: "-",
    theme_key: "-",
  },
  sliderThemes: {
    code: "-",
    name: "-",
    sort_order: 0,
    add_to_cart_label: "-",
    view_details_label: "-",
    background_from: "-",
    background_via: "-",
    background_to: "-",
    text_color: "-",
    muted_text_color: "-",
    badge_background: "-",
    badge_text_color: "-",
    primary_button_background: "-",
    primary_button_text_color: "-",
    secondary_button_background: "-",
    secondary_button_text_color: "-",
    nav_background: "-",
    nav_text_color: "-",
  },
}

export const commonModuleItemsByKey: Record<CommonModuleKey, CommonModuleItem[]> =
  Object.fromEntries(
    (Object.entries(baseCommonModuleItemsByKey) as Array<[CommonModuleKey, CommonModuleItem[]]>).map(
      ([moduleKey, items]) => [
        moduleKey,
        [defineItem(defaultRecordId, defaultCommonModuleRows[moduleKey]), ...items],
      ]
    )
  ) as Record<CommonModuleKey, CommonModuleItem[]>
