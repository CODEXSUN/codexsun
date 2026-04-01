import type { CommonModuleItem, CommonModuleKey, CommonModuleUpsertPayload } from '@shared/index'
import { createCommonModuleItem } from '@/shared/api/client'

export type LookupOption = {
  value: string
  label: string
}

export function toLookupOption(item: CommonModuleItem): LookupOption {
  const name = typeof item.name === 'string' ? item.name : null
  const code = typeof item.code === 'string' ? item.code : null
  const label = name ?? code ?? String(item.id)

  return {
    value: String(item.id),
    label,
  }
}

function normalizeLabel(label: string) {
  return label.trim().replace(/\s+/g, ' ')
}

function toCode(label: string) {
  const normalized = normalizeLabel(label)
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || normalized || '-'
}

function buildCommonLookupPayload(
  moduleKey: CommonModuleKey,
  rawLabel: string,
): CommonModuleUpsertPayload {
  const label = normalizeLabel(rawLabel)
  const code = toCode(label)

  switch (moduleKey) {
    case 'countries':
      return { code, name: label, phone_code: '-' }
    case 'states':
      return { country_id: '1', code, name: label }
    case 'districts':
      return { state_id: '1', code, name: label }
    case 'cities':
      return { state_id: '1', district_id: '1', code, name: label }
    case 'pincodes':
      return { country_id: '1', state_id: '1', district_id: '1', city_id: '1', code, area_name: label }
    case 'contactGroups':
    case 'contactTypes':
    case 'productGroups':
    case 'productCategories':
    case 'productTypes':
    case 'brands':
    case 'styles':
    case 'transports':
    case 'destinations':
    case 'orderTypes':
      return { code, name: label, description: '-' }
    case 'units':
      return { code, name: label, symbol: '-', description: '-' }
    case 'hsnCodes':
      return { code, name: label, description: '-' }
    case 'taxes':
      return { code, name: label, tax_type: 'gst', rate_percent: 0, description: '-' }
    case 'colours':
      return { code, name: label, hex_code: null, description: '-' }
    case 'sizes':
      return { code, name: label, sort_order: 0, description: '-' }
    case 'currencies':
      return { code: code.toUpperCase(), name: label, symbol: '-', decimal_places: 2 }
    case 'warehouses':
      return {
        code,
        name: label,
        country_id: '1',
        state_id: '1',
        district_id: '1',
        city_id: '1',
        pincode_id: '1',
        address_line1: '-',
        address_line2: '-',
        description: '-',
      }
    case 'paymentTerms':
      return { code, name: label, due_days: 0, description: '-' }
    case 'storefrontTemplates':
      return {
        code,
        name: label,
        sort_order: 0,
        badge_text: null,
        title: label,
        description: '-',
        cta_primary_label: null,
        cta_primary_href: null,
        cta_secondary_label: null,
        cta_secondary_href: null,
        icon_key: null,
        theme_key: null,
      }
    case 'sliderThemes':
      return {
        code,
        name: label,
        sort_order: 0,
        add_to_cart_label: 'Add to cart',
        view_details_label: 'View details',
        background_from: '#2b1a14',
        background_via: '#6b4633',
        background_to: '#f2ddc8',
        text_color: null,
        muted_text_color: null,
        badge_background: null,
        badge_text_color: null,
        primary_button_background: null,
        primary_button_text_color: null,
        secondary_button_background: null,
        secondary_button_text_color: null,
        nav_background: null,
        nav_text_color: null,
      }
  }
}

export async function createCommonLookupOption(moduleKey: CommonModuleKey, label: string) {
  const item = await createCommonModuleItem(moduleKey, buildCommonLookupPayload(moduleKey, label))
  return {
    item,
    option: toLookupOption(item),
  }
}
