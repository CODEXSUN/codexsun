import type { CommonModuleItem, CommonModuleUpsertPayload } from '@shared/index'

export type StorefrontTemplateRecord = CommonModuleItem & {
  code: string
  name: string
  sort_order: number
  badge_text: string | null
  title: string
  description: string | null
  cta_primary_label: string | null
  cta_primary_href: string | null
  cta_secondary_label: string | null
  cta_secondary_href: string | null
  icon_key: string | null
  theme_key: string | null
}

export type StorefrontTemplateFormValues = {
  code: string
  name: string
  sort_order: number
  badge_text: string
  title: string
  description: string
  cta_primary_label: string
  cta_primary_href: string
  cta_secondary_label: string
  cta_secondary_href: string
  icon_key: string
  theme_key: string
  isActive: boolean
}

export const storefrontTemplateSlots = [
  {
    value: 'home-category',
    label: 'Home Category',
    kind: 'Home section',
    description: 'Shop-by-category badge, heading, helper copy, and primary CTA directly below the hero.',
  },
  {
    value: 'home-featured',
    label: 'Home Featured',
    kind: 'Home section',
    description: 'Featured products heading and supporting description above the featured product grid.',
  },
  {
    value: 'home-new-arrivals',
    label: 'Home New Arrivals',
    kind: 'Home section',
    description: 'New-arrivals headline and copy for recently published catalog entries.',
  },
  {
    value: 'home-bestsellers',
    label: 'Home Best Sellers',
    kind: 'Home section',
    description: 'Best-seller editorial copy for the backend-driven bestseller group.',
  },
  {
    value: 'home-featured-labels',
    label: 'Home Featured Labels',
    kind: 'Home section',
    description: 'Brand-label heading and description for the featured labels rail.',
  },
  {
    value: 'home-cta',
    label: 'Home CTA',
    kind: 'Home section',
    description: 'Full-width call-to-action block near the bottom of the storefront home page.',
  },
  {
    value: 'trust-editorial',
    label: 'Trust Editorial',
    kind: 'Trust note',
    description: 'First trust card now rendered at the end of the page.',
  },
  {
    value: 'trust-delivery',
    label: 'Trust Delivery',
    kind: 'Trust note',
    description: 'Second trust card focused on buying flow and storefront delivery confidence.',
  },
  {
    value: 'trust-shell',
    label: 'Trust Shell',
    kind: 'Trust note',
    description: 'Third trust card explaining shell consistency and backend-connected merchandising.',
  },
] as const

export const storefrontThemeOptions = [
  { value: '', label: 'Default' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'sand', label: 'Sand' },
  { value: 'mist', label: 'Mist' },
  { value: 'cta', label: 'CTA' },
  { value: 'trust', label: 'Trust' },
] as const

export const storefrontIconOptions = [
  { value: '', label: 'No icon' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'truck', label: 'Truck' },
  { value: 'shield', label: 'Shield' },
] as const

const slotByCode = new Map(storefrontTemplateSlots.map((slot) => [slot.value, slot]))

function normalizeText(value: unknown, fallback = '') {
  if (typeof value !== 'string') {
    return fallback
  }

  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed === '-') {
    return fallback
  }

  return trimmed
}

function normalizeNullableText(value: unknown) {
  const normalized = normalizeText(value)
  return normalized.length > 0 ? normalized : null
}

function normalizeNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getStorefrontTemplateSlotMeta(code: string) {
  return slotByCode.get(code as (typeof storefrontTemplateSlots)[number]['value']) ?? {
    value: code,
    label: code || 'Custom template',
    kind: 'Custom slot',
    description: 'This template code is not yet mapped in the storefront shell.',
  }
}

export function formatStorefrontTemplateTheme(themeKey: string | null | undefined) {
  return storefrontThemeOptions.find((option) => option.value === (themeKey ?? ''))?.label ?? 'Custom'
}

export function formatStorefrontTemplateIcon(iconKey: string | null | undefined) {
  return storefrontIconOptions.find((option) => option.value === (iconKey ?? ''))?.label ?? 'Custom'
}

export function toStorefrontTemplateRecord(item: CommonModuleItem): StorefrontTemplateRecord {
  return {
    ...item,
    code: normalizeText(item.code),
    name: normalizeText(item.name),
    sort_order: normalizeNumber(item.sort_order, 0),
    badge_text: normalizeNullableText(item.badge_text),
    title: normalizeText(item.title),
    description: normalizeNullableText(item.description),
    cta_primary_label: normalizeNullableText(item.cta_primary_label),
    cta_primary_href: normalizeNullableText(item.cta_primary_href),
    cta_secondary_label: normalizeNullableText(item.cta_secondary_label),
    cta_secondary_href: normalizeNullableText(item.cta_secondary_href),
    icon_key: normalizeNullableText(item.icon_key),
    theme_key: normalizeNullableText(item.theme_key),
  }
}

export function createDefaultStorefrontTemplateValues(): StorefrontTemplateFormValues {
  return {
    code: '',
    name: '',
    sort_order: 0,
    badge_text: '',
    title: '',
    description: '',
    cta_primary_label: '',
    cta_primary_href: '',
    cta_secondary_label: '',
    cta_secondary_href: '',
    icon_key: '',
    theme_key: '',
    isActive: true,
  }
}

export function toStorefrontTemplateFormValues(item: CommonModuleItem): StorefrontTemplateFormValues {
  const record = toStorefrontTemplateRecord(item)

  return {
    code: record.code,
    name: record.name,
    sort_order: record.sort_order,
    badge_text: record.badge_text ?? '',
    title: record.title,
    description: record.description ?? '',
    cta_primary_label: record.cta_primary_label ?? '',
    cta_primary_href: record.cta_primary_href ?? '',
    cta_secondary_label: record.cta_secondary_label ?? '',
    cta_secondary_href: record.cta_secondary_href ?? '',
    icon_key: record.icon_key ?? '',
    theme_key: record.theme_key ?? '',
    isActive: record.isActive,
  }
}

function toNullableValue(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function toStorefrontTemplatePayload(
  values: StorefrontTemplateFormValues,
): CommonModuleUpsertPayload {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    sort_order: Number.isFinite(values.sort_order) ? values.sort_order : 0,
    badge_text: toNullableValue(values.badge_text),
    title: values.title.trim(),
    description: toNullableValue(values.description),
    cta_primary_label: toNullableValue(values.cta_primary_label),
    cta_primary_href: toNullableValue(values.cta_primary_href),
    cta_secondary_label: toNullableValue(values.cta_secondary_label),
    cta_secondary_href: toNullableValue(values.cta_secondary_href),
    icon_key: toNullableValue(values.icon_key),
    theme_key: toNullableValue(values.theme_key),
    isActive: values.isActive,
  }
}
