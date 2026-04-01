import type {
  CommonModuleKey,
  CommonModuleMetadata,
  CommonModuleMetadataColumn,
  CommonModuleUpsertPayload,
} from '@shared/index'
import type { CommonMasterDefinition } from '@/components/forms/commonMasterTypes'
import type { CommonUpsertFormValues, CommonUpsertSelectOption } from '@/components/forms/CommonUpsertDialog'
import {
  createCommonModuleItem,
  deactivateCommonModuleItem,
  getCommonModuleItem,
  listCommonModuleItems,
  restoreCommonModuleItem,
  updateCommonModuleItem,
} from '@/shared/api/client'
import { getCommonModuleMenuItem } from '../config/common-module-navigation'

function toEntityLabel(title: string) {
  if (title.endsWith('ies')) {
    return `${title.slice(0, -3)}y`
  }

  if (title.endsWith('s')) {
    return title.slice(0, -1)
  }

  return title
}

function formatReferenceLabel(item: Record<string, unknown>) {
  const name = typeof item.name === 'string' ? item.name : null
  const code = typeof item.code === 'string' ? item.code : null

  if (name && code) {
    return `${name} (${code})`
  }

  return name ?? code ?? String(item.id)
}

function toSelectOptions(referenceModule: CommonModuleKey) {
  return async () => {
    const items = await listCommonModuleItems(referenceModule, false)
    return items.map((item) => ({
      value: String(item.id),
      label: formatReferenceLabel(item),
    })) satisfies CommonUpsertSelectOption[]
  }
}

function toFieldDefinition(column: CommonModuleMetadataColumn) {
  return {
    key: column.key,
    label: column.label,
    type: column.referenceModule ? 'select' : column.key === 'image' ? 'image' : column.type === 'number' ? 'number' : column.type === 'boolean' ? 'checkbox' : 'text',
    required: column.required,
    placeholder: column.label,
    parseAs: column.type,
    loadOptions: column.referenceModule ? toSelectOptions(column.referenceModule) : undefined,
  } as const
}

function toColumnDefinition(column: CommonModuleMetadataColumn) {
  return {
    id: column.key,
    header: column.label,
    accessor: (item: Record<string, unknown>) =>
      item[column.key] as string | number | boolean | Date | null | undefined,
    cell: column.key === 'image'
      ? (item: Record<string, unknown>) => {
          const value = typeof item.image === 'string' ? item.image.trim() : ''

          return value
            ? (
                <div className="flex items-center">
                  <img
                    src={value}
                    alt="Category"
                    className="h-10 w-10 rounded-md border border-border/60 object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )
            : <span className="text-muted-foreground">No image</span>
        }
      : undefined,
  }
}

export function buildCommonModuleDefinition(metadata: CommonModuleMetadata): CommonMasterDefinition {
  const menuItem = getCommonModuleMenuItem(metadata.key)
  const writableColumns = metadata.columns

  return {
    key: metadata.key,
    slug: metadata.key,
    groupKey: menuItem.groupKey,
    menuTitle: menuItem.title,
    pageTitle: menuItem.title,
    pageDescription: menuItem.description,
    entityLabel: toEntityLabel(menuItem.title),
    searchPlaceholder: `Search ${menuItem.title.toLowerCase()}`,
    fields: writableColumns.map(toFieldDefinition),
    columns: writableColumns
      .slice(0, Math.min(4, writableColumns.length))
      .map(toColumnDefinition),
    api: {
      list: () => listCommonModuleItems(metadata.key, true),
      getById: (id: string) => getCommonModuleItem(metadata.key, id),
      create: (request: unknown) => createCommonModuleItem(metadata.key, request as CommonModuleUpsertPayload),
      update: (id: string, request: unknown) =>
        updateCommonModuleItem(metadata.key, id, request as CommonModuleUpsertPayload),
      delete: async (id: string) => {
        await deactivateCommonModuleItem(metadata.key, id)
      },
      restore: async (id: string) => {
        await restoreCommonModuleItem(metadata.key, id)
      },
    },
    toRequest: (values: CommonUpsertFormValues) =>
      Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, value === '' ? null : value]),
      ) as CommonModuleUpsertPayload,
    toFormValues: (item) => ({
      isActive: item.isActive,
      ...Object.fromEntries(writableColumns.map((column) => [column.key, item[column.key] ?? ''])),
    }),
  }
}
