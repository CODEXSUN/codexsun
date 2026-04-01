import type { CommonModuleKey } from '@shared/index'
import type { ReactNode } from "react"

import type {
  CommonUpsertFieldDefinition,
  CommonUpsertFormValues,
  CommonUpsertSelectOption,
} from "@/components/forms/CommonUpsertDialog"
import type { CommonMasterItem } from "@/types/common"

export type CommonMasterFieldDefinition = CommonUpsertFieldDefinition & {
  loadOptions?: () => Promise<CommonUpsertSelectOption[]>
}

export type CommonMasterTableColumn = {
  id: string
  header: string
  accessor: (item: CommonMasterItem) => string | number | boolean | Date | null | undefined
  cell?: (item: CommonMasterItem) => ReactNode
  className?: string
  headerClassName?: string
  sticky?: "left" | "right"
}

export type CommonMasterApi = {
  list: () => Promise<CommonMasterItem[]>
  getById: (id: string) => Promise<CommonMasterItem | null>
  create: (request: unknown) => Promise<CommonMasterItem>
  update: (id: string, request: unknown) => Promise<CommonMasterItem>
  delete: (id: string) => Promise<void>
  restore: (id: string) => Promise<void>
}

export type CommonMasterDefinition = {
  key: CommonModuleKey
  slug: string
  groupKey: string
  menuTitle: string
  pageTitle: string
  pageDescription: string
  entityLabel: string
  searchPlaceholder: string
  fields: CommonMasterFieldDefinition[]
  columns: CommonMasterTableColumn[]
  api: CommonMasterApi
  toRequest: (values: CommonUpsertFormValues) => unknown
  toFormValues?: (item: CommonMasterItem) => CommonUpsertFormValues
}
