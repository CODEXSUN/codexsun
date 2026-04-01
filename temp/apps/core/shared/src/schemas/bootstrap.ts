import { z } from 'zod'

export const readinessSchema = z.enum(['foundation', 'planned', 'active'])

export const moduleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  readiness: readinessSchema,
})

export const bootstrapSnapshotSchema = z.object({
  productName: z.literal('codexsun'),
  mission: z.string().min(1),
  channels: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      summary: z.string().min(1),
    }),
  ),
  modules: z.array(moduleSchema),
  engineeringRules: z.array(z.string().min(1)),
})

export type BootstrapSnapshot = z.infer<typeof bootstrapSnapshotSchema>
