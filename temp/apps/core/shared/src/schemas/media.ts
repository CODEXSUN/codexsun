import { z } from 'zod'

export const mediaStorageScopeSchema = z.enum(['public', 'private'])

export const mediaFileTypeSchema = z.enum(['image', 'video', 'document', 'other'])

export const mediaFolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mediaTagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mediaUsageSchema = z.object({
  id: z.string().min(1),
  mediaId: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  usageType: z.string().min(1),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mediaVersionSchema = z.object({
  id: z.string().min(1),
  mediaId: z.string().min(1),
  versionType: z.string().min(1),
  filePath: z.string().min(1),
  fileUrl: z.string().min(1),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mediaSummarySchema = z.object({
  id: z.string().min(1),
  uuid: z.string().min(1),
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  filePath: z.string().min(1),
  fileUrl: z.string().min(1),
  thumbnailPath: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  fileType: mediaFileTypeSchema,
  mimeType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  altText: z.string().nullable(),
  title: z.string().nullable(),
  folderId: z.string().nullable(),
  folderName: z.string().nullable(),
  storageScope: mediaStorageScopeSchema,
  isOptimized: z.boolean(),
  isActive: z.boolean(),
  tagCount: z.number().int().nonnegative(),
  usageCount: z.number().int().nonnegative(),
  versionCount: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mediaSchema = mediaSummarySchema.extend({
  folder: mediaFolderSchema.nullable(),
  tags: z.array(mediaTagSchema),
  usages: z.array(mediaUsageSchema),
  versions: z.array(mediaVersionSchema),
})

export const mediaFolderUpsertPayloadSchema = z.object({
  name: z.string().trim().min(1),
  parentId: z.string().trim().nullish().transform((value) => value || null),
  isActive: z.boolean().optional().default(true),
})

export const mediaTagInputSchema = z.object({
  name: z.string().trim().min(1),
})

export const mediaUsageInputSchema = z.object({
  entityType: z.string().trim().min(1),
  entityId: z.string().trim().min(1),
  usageType: z.string().trim().min(1),
})

export const mediaVersionInputSchema = z.object({
  versionType: z.string().trim().min(1),
  filePath: z.string().trim().min(1),
  width: z.number().int().nullable().optional().default(null),
  height: z.number().int().nullable().optional().default(null),
})

export const mediaUpsertPayloadSchema = z.object({
  fileName: z.string().trim().min(1),
  originalName: z.string().trim().min(1),
  filePath: z.string().trim().min(1),
  thumbnailPath: z.string().trim().nullish().transform((value) => value || null),
  fileType: mediaFileTypeSchema,
  mimeType: z.string().trim().min(1),
  fileSize: z.number().int().nonnegative().default(0),
  width: z.number().int().nullable().optional().default(null),
  height: z.number().int().nullable().optional().default(null),
  altText: z.string().trim().nullish().transform((value) => value || null),
  title: z.string().trim().nullish().transform((value) => value || null),
  folderId: z.string().trim().nullish().transform((value) => value || null),
  storageScope: mediaStorageScopeSchema.default('public'),
  isOptimized: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  tags: z.array(mediaTagInputSchema).default([]),
  usages: z.array(mediaUsageInputSchema).default([]),
  versions: z.array(mediaVersionInputSchema).default([]),
})

export const mediaImageUploadPayloadSchema = z.object({
  fileName: z.string().trim().min(1),
  originalName: z.string().trim().min(1),
  dataUrl: z.string().trim().min(1),
  folderId: z.string().trim().nullish().transform((value) => value || null),
  storageScope: mediaStorageScopeSchema.default('public'),
  title: z.string().trim().nullish().transform((value) => value || null),
  altText: z.string().trim().nullish().transform((value) => value || null),
  isActive: z.boolean().optional().default(true),
})

export const mediaListResponseSchema = z.object({
  items: z.array(mediaSummarySchema),
})

export const mediaResponseSchema = z.object({
  item: mediaSchema,
})

export const mediaFolderListResponseSchema = z.object({
  items: z.array(mediaFolderSchema),
})

export const mediaFolderResponseSchema = z.object({
  item: mediaFolderSchema,
})

export type MediaStorageScope = z.infer<typeof mediaStorageScopeSchema>
export type MediaFileType = z.infer<typeof mediaFileTypeSchema>
export type MediaFolder = z.infer<typeof mediaFolderSchema>
export type MediaTag = z.infer<typeof mediaTagSchema>
export type MediaUsage = z.infer<typeof mediaUsageSchema>
export type MediaVersion = z.infer<typeof mediaVersionSchema>
export type MediaSummary = z.infer<typeof mediaSummarySchema>
export type Media = z.infer<typeof mediaSchema>
export type MediaFolderUpsertPayload = z.infer<typeof mediaFolderUpsertPayloadSchema>
export type MediaTagInput = z.infer<typeof mediaTagInputSchema>
export type MediaUsageInput = z.infer<typeof mediaUsageInputSchema>
export type MediaVersionInput = z.infer<typeof mediaVersionInputSchema>
export type MediaUpsertPayload = z.infer<typeof mediaUpsertPayloadSchema>
export type MediaImageUploadPayload = z.infer<typeof mediaImageUploadPayloadSchema>
export type MediaListResponse = z.infer<typeof mediaListResponseSchema>
export type MediaResponse = z.infer<typeof mediaResponseSchema>
export type MediaFolderListResponse = z.infer<typeof mediaFolderListResponseSchema>
export type MediaFolderResponse = z.infer<typeof mediaFolderResponseSchema>
