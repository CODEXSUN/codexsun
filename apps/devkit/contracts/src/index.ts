import { z } from 'zod'

export const registryKindSchema = z.enum([
  'project',
  'app',
  'module-group',
  'submodule-group',
  'module',
])
export const registryStatusSchema = z.enum(['planned', 'active', 'blocked', 'ready'])
export const confirmationSchema = z.enum(['pending', 'approved', 'needs-revision'])
export const registryProfileSectionSchema = z.enum([
  'info',
  'database',
  'routes',
  'files',
  'actions',
  'events',
  'planning',
])
export const registryProfileEntrySchema = z.object({
  id: z.string().min(1).max(120),
  key: z.string().min(1).max(120),
  value: z.string().min(1).max(600),
})
export const registryProfileSchema = z.object({
  actions: z.array(registryProfileEntrySchema),
  database: z.array(registryProfileEntrySchema),
  events: z.array(registryProfileEntrySchema),
  files: z.array(registryProfileEntrySchema),
  info: z.array(registryProfileEntrySchema),
  planning: z.array(registryProfileEntrySchema),
  routes: z.array(registryProfileEntrySchema),
})

export type RegistryNode = {
  children: RegistryNode[]
  confirmation: z.infer<typeof confirmationSchema>
  enabled: boolean
  id: string
  key: string
  kind: z.infer<typeof registryKindSchema>
  profile: z.infer<typeof registryProfileSchema>
  status: z.infer<typeof registryStatusSchema>
  summary: string
  title: string
}

export const registryNodeSchema: z.ZodType<RegistryNode> = z.object({
  children: z.array(z.lazy(() => registryNodeSchema)),
  confirmation: confirmationSchema,
  enabled: z.boolean(),
  id: z.string().min(1).max(120),
  key: z.string().min(1).max(160),
  kind: registryKindSchema,
  profile: registryProfileSchema,
  status: registryStatusSchema,
  summary: z.string().min(1).max(600),
  title: z.string().min(1).max(160),
})

export const registryResponseSchema = z.object({
  generatedAt: z.string(),
  root: registryNodeSchema,
})
export const confirmationRequestSchema = z.object({
  confirmation: confirmationSchema.exclude(['pending']),
})
export const confirmationResponseSchema = z.object({
  node: registryNodeSchema,
  updatedAt: z.string(),
})
export const registryNodeCreateSchema = z.object({
  kind: registryKindSchema.exclude(['project']),
  parentId: z.string().min(1).max(120),
  summary: z.string().min(1).max(600),
  title: z.string().min(1).max(160),
})
export const registryNodeUpdateSchema = z.object({
  enabled: z.boolean(),
  key: z.string().min(1).max(160),
  status: registryStatusSchema,
  summary: z.string().min(1).max(600),
  title: z.string().min(1).max(160),
})
export const registryNodeResponseSchema = z.object({
  node: registryNodeSchema,
  updatedAt: z.string(),
})
export const registryProfileEntryUpsertSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  key: z.string().min(1).max(120),
  value: z.string().min(1).max(600),
})

export type RegistryResponse = z.infer<typeof registryResponseSchema>
export type RegistryProfile = z.infer<typeof registryProfileSchema>
export type RegistryProfileSection = z.infer<typeof registryProfileSectionSchema>
