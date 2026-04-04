import { z } from "zod"

export const mediaStorageScopeSchema = z.enum(["public", "private"])
export const mediaStorageProviderSchema = z.enum([
  "local",
  "s3",
  "cdn",
  "google-drive",
  "custom",
])
export const mediaFileTypeSchema = z.enum([
  "image",
  "video",
  "audio",
  "document",
  "archive",
  "other",
])

export const mediaFolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mediaVersionSchema = z.object({
  id: z.string().min(1),
  mediaId: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  fileUrl: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mediaSummarySchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  title: z.string().nullable(),
  altText: z.string().nullable(),
  description: z.string().nullable(),
  provider: mediaStorageProviderSchema,
  storageScope: mediaStorageScopeSchema,
  fileType: mediaFileTypeSchema,
  mimeType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  folderId: z.string().nullable(),
  folderName: z.string().nullable(),
  tags: z.array(z.string().min(1)).default([]),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  fileUrl: z.string().min(1),
  thumbnailUrl: z.string().nullable(),
  backendKey: z.string().min(1),
  disk: z.string().min(1),
  root: z.string().min(1),
  extension: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const mediaSchema = mediaSummarySchema.extend({
  versions: z.array(mediaVersionSchema).default([]),
})

export const mediaFolderUpsertPayloadSchema = z.object({
  name: z.string().trim().min(1),
  parentId: z.string().trim().min(1).nullable().default(null),
  isActive: z.boolean().optional().default(true),
})

export const mediaImageUploadPayloadSchema = z.object({
  fileName: z.string().trim().min(1),
  originalName: z.string().trim().min(1),
  dataUrl: z.string().trim().min(1),
  folderId: z.string().trim().min(1).nullable().default(null),
  storageScope: mediaStorageScopeSchema.default("public"),
  title: z.string().trim().nullable().default(null),
  altText: z.string().trim().nullable().default(null),
  description: z.string().trim().nullable().default(null),
  tags: z.array(z.string().trim().min(1)).default([]),
  isActive: z.boolean().optional().default(true),
})

export const mediaUpsertPayloadSchema = z.object({
  title: z.string().trim().nullable().default(null),
  altText: z.string().trim().nullable().default(null),
  description: z.string().trim().nullable().default(null),
  folderId: z.string().trim().min(1).nullable().default(null),
  storageScope: mediaStorageScopeSchema.default("public"),
  tags: z.array(z.string().trim().min(1)).default([]),
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
export type MediaStorageProvider = z.infer<typeof mediaStorageProviderSchema>
export type MediaFileType = z.infer<typeof mediaFileTypeSchema>
export type MediaFolder = z.infer<typeof mediaFolderSchema>
export type MediaVersion = z.infer<typeof mediaVersionSchema>
export type MediaSummary = z.infer<typeof mediaSummarySchema>
export type Media = z.infer<typeof mediaSchema>
export type MediaFolderUpsertPayload = z.infer<typeof mediaFolderUpsertPayloadSchema>
export type MediaImageUploadPayload = z.infer<typeof mediaImageUploadPayloadSchema>
export type MediaUpsertPayload = z.infer<typeof mediaUpsertPayloadSchema>
export type MediaListResponse = z.infer<typeof mediaListResponseSchema>
export type MediaResponse = z.infer<typeof mediaResponseSchema>
export type MediaFolderListResponse = z.infer<typeof mediaFolderListResponseSchema>
export type MediaFolderResponse = z.infer<typeof mediaFolderResponseSchema>
