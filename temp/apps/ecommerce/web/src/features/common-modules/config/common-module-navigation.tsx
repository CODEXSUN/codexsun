import type { CommonModuleKey } from '@shared/index'
import type { LucideIcon } from 'lucide-react'
import {
  BadgePercent,
  Boxes,
  Building2,
  ContactRound,
  Flag,
  Globe2,
  Landmark,
  MapPin,
  Palette,
  Package,
  Ruler,
  Scale,
  Shirt,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
  Warehouse,
} from 'lucide-react'
import { buildAdminPortalPath } from '@framework-core/web/auth/lib/portal-routing'

export type CommonModuleGroupKey =
  | 'location'
  | 'contacts'
  | 'catalog'
  | 'inventory'
  | 'commercial'
  | 'storefront'

export type CommonModuleMenuItem = {
  key: CommonModuleKey
  title: string
  icon: LucideIcon
  description: string
}

export type CommonModuleMenuGroup = {
  key: CommonModuleGroupKey
  title: string
  icon: LucideIcon
  items: CommonModuleMenuItem[]
}

export const commonModuleMenuGroups: CommonModuleMenuGroup[] = [
  {
    key: 'location',
    title: 'Location',
    icon: Globe2,
    items: [
      { key: 'countries', title: 'Countries', icon: Flag, description: 'Country master and dialing defaults.' },
      { key: 'states', title: 'States', icon: MapPin, description: 'State and province definitions.' },
      { key: 'districts', title: 'Districts', icon: Building2, description: 'District classification under states.' },
      { key: 'cities', title: 'Cities', icon: Landmark, description: 'City-level operating locations.' },
      { key: 'pincodes', title: 'Pincodes', icon: MapPin, description: 'Postal code and delivery areas.' },
    ],
  },
  {
    key: 'contacts',
    title: 'Contacts',
    icon: ContactRound,
    items: [
      { key: 'contactGroups', title: 'Contact Groups', icon: ContactRound, description: 'Contact segmentation for customers, vendors, and partners.' },
      { key: 'contactTypes', title: 'Contact Types', icon: ShieldCheck, description: 'Contact roles and identity types.' },
    ],
  },
  {
    key: 'catalog',
    title: 'Catalog',
    icon: Package,
    items: [
      { key: 'productGroups', title: 'Product Groups', icon: Boxes, description: 'Top-level product grouping.' },
      { key: 'productCategories', title: 'Product Categories', icon: Shirt, description: 'Sell-side category classification.' },
      { key: 'productTypes', title: 'Product Types', icon: Package, description: 'Stock, service, and bundle type definitions.' },
      { key: 'brands', title: 'Brands', icon: Building2, description: 'Brand master used across catalog and procurement.' },
      { key: 'colours', title: 'Colours', icon: Palette, description: 'Colour names and visual references.' },
      { key: 'sizes', title: 'Sizes', icon: Ruler, description: 'Size values and sort order.' },
      { key: 'styles', title: 'Styles', icon: Shirt, description: 'Style and assortment classification.' },
      { key: 'units', title: 'Units', icon: Scale, description: 'Quantity and measurement units.' },
      { key: 'hsnCodes', title: 'HSN Codes', icon: BadgePercent, description: 'Tax classification for products.' },
      { key: 'taxes', title: 'Taxes', icon: BadgePercent, description: 'Tax slabs and rate configuration.' },
    ],
  },
  {
    key: 'inventory',
    title: 'Inventory',
    icon: Truck,
    items: [
      { key: 'warehouses', title: 'Warehouses', icon: Warehouse, description: 'Warehouse and stock location records.' },
      { key: 'transports', title: 'Transports', icon: Truck, description: 'Transport method master.' },
      { key: 'destinations', title: 'Destinations', icon: MapPin, description: 'Shipping and movement destination types.' },
      { key: 'orderTypes', title: 'Order Types', icon: Package, description: 'Order flow types across buying and selling.' },
    ],
  },
  {
    key: 'commercial',
    title: 'Commercial',
    icon: Wallet,
    items: [
      { key: 'currencies', title: 'Currencies', icon: Wallet, description: 'Currency code and symbol defaults.' },
      { key: 'paymentTerms', title: 'Payment Terms', icon: BadgePercent, description: 'Payment due-day rules for trade flows.' },
    ],
  },
  {
    key: 'storefront',
    title: 'Storefront',
    icon: Sparkles,
    items: [
      { key: 'storefrontTemplates', title: 'Storefront Templates', icon: Sparkles, description: 'Home-page copy, CTA, and trust-section content for the storefront.' },
      { key: 'sliderThemes', title: 'Slider Themes', icon: Palette, description: 'Hero-slider gradients, CTA labels, text colors, and navigation styling.' },
    ],
  },
]

const menuItemByKey = Object.fromEntries(
  commonModuleMenuGroups.flatMap((group) =>
    group.items.map((item) => [item.key, { ...item, groupKey: group.key, groupTitle: group.title }]),
  ),
) as Record<CommonModuleKey, CommonModuleMenuItem & { groupKey: CommonModuleGroupKey; groupTitle: string }>

export function getCommonModuleMenuItem(key: CommonModuleKey) {
  return menuItemByKey[key]
}

export function getCommonModuleHref(key: CommonModuleKey) {
  if (key === 'productCategories') {
    return buildAdminPortalPath('/product-categories')
  }

  if (key === 'storefrontTemplates') {
    return buildAdminPortalPath('/storefront-designer')
  }

  if (key === 'sliderThemes') {
    return buildAdminPortalPath('/slider-themes')
  }

  return buildAdminPortalPath(`/common/${key}`)
}
