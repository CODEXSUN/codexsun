import type { CommonModuleItem, CommonModuleUpsertPayload } from '@shared/index'

export type ProductCategoryRecord = CommonModuleItem & {
  code: string
  name: string
  description: string | null
  image: string | null
  positionOrder: number
  showInTopMenu: boolean
  showInCatalogSection: boolean
}

export type ProductCategoryFormValues = {
  code: string
  name: string
  description: string
  image: string
  positionOrder: string
  showInTopMenu: boolean
  showInCatalogSection: boolean
  isActive: boolean
}

function normalizeText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function normalizeBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
  }

  return false
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export function toProductCategoryRecord(item: CommonModuleItem): ProductCategoryRecord {
  return {
    ...item,
    code: normalizeText(item.code) ?? '',
    name: normalizeText(item.name) ?? '',
    description: normalizeText(item.description),
    image: normalizeText(item.image),
    positionOrder: normalizeNumber(item.position_order),
    showInTopMenu: normalizeBoolean(item.show_on_storefront_top_menu),
    showInCatalogSection: normalizeBoolean(item.show_on_storefront_catalog),
  }
}

export function toProductCategoryFormValues(item?: ProductCategoryRecord | null): ProductCategoryFormValues {
  return {
    code: item?.code ?? '',
    name: item?.name ?? '',
    description: item?.description ?? '',
    image: item?.image ?? '',
    positionOrder: String(item?.positionOrder ?? 0),
    showInTopMenu: item?.showInTopMenu ?? true,
    showInCatalogSection: item?.showInCatalogSection ?? true,
    isActive: item?.isActive ?? true,
  }
}

export function toProductCategoryPayload(values: ProductCategoryFormValues): CommonModuleUpsertPayload {
  const parsedPositionOrder = Number(values.positionOrder)

  return {
    code: values.code.trim(),
    name: values.name.trim(),
    description: values.description.trim() || null,
    image: values.image.trim() || null,
    position_order: Number.isFinite(parsedPositionOrder) ? parsedPositionOrder : 0,
    show_on_storefront_top_menu: values.showInTopMenu,
    show_on_storefront_catalog: values.showInCatalogSection,
    isActive: values.isActive,
  }
}
