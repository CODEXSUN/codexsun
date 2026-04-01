import { z } from 'zod'

const commonModuleKeys = [
  'countries',
  'states',
  'districts',
  'cities',
  'pincodes',
  'contactGroups',
  'contactTypes',
  'productGroups',
  'productCategories',
  'productTypes',
  'units',
  'hsnCodes',
  'taxes',
  'brands',
  'colours',
  'sizes',
  'currencies',
  'orderTypes',
  'styles',
  'transports',
  'warehouses',
  'destinations',
  'paymentTerms',
  'storefrontTemplates',
  'sliderThemes',
] as const

export const commonModuleKeySchema = z.enum(commonModuleKeys)

export const commonModuleValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
])

export const commonModuleItemSchema = z
  .object({
    id: z.string().min(1),
    isActive: z.boolean(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .catchall(commonModuleValueSchema)

export const commonModuleUpsertPayloadSchema = z
  .object({
    isActive: z.boolean().optional(),
  })
  .catchall(commonModuleValueSchema)

export const commonModuleMetadataColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean']),
  required: z.boolean(),
  nullable: z.boolean(),
  referenceModule: commonModuleKeySchema.optional(),
})

export const commonModuleMetadataSchema = z.object({
  key: commonModuleKeySchema,
  label: z.string().min(1),
  defaultSortKey: z.string().min(1),
  columns: z.array(commonModuleMetadataColumnSchema),
})

export const commonModuleListResponseSchema = z.object({
  module: commonModuleKeySchema,
  items: z.array(commonModuleItemSchema),
})

export const commonModuleRecordResponseSchema = z.object({
  module: commonModuleKeySchema,
  item: commonModuleItemSchema,
})

export const commonModuleMetadataListResponseSchema = z.object({
  modules: z.array(commonModuleMetadataSchema),
})

export const commonModuleMetadataResponseSchema = z.object({
  module: commonModuleMetadataSchema,
})

export type CommonModuleKey = z.infer<typeof commonModuleKeySchema>
export type CommonModuleValue = z.infer<typeof commonModuleValueSchema>
export type CommonModuleItem = z.infer<typeof commonModuleItemSchema>
export type CommonModuleUpsertPayload = z.infer<typeof commonModuleUpsertPayloadSchema>
export type CommonModuleMetadataColumn = z.infer<typeof commonModuleMetadataColumnSchema>
export type CommonModuleMetadata = z.infer<typeof commonModuleMetadataSchema>
export type CommonModuleListResponse = z.infer<typeof commonModuleListResponseSchema>
export type CommonModuleRecordResponse = z.infer<typeof commonModuleRecordResponseSchema>
export type CommonModuleMetadataListResponse = z.infer<
  typeof commonModuleMetadataListResponseSchema
>
export type CommonModuleMetadataResponse = z.infer<
  typeof commonModuleMetadataResponseSchema
>
