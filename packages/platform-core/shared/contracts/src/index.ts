import { z } from 'zod'

export const responseMetaSchema = z.object({
  correlationId: z.string().min(1),
  requestId: z.string().min(1),
  timestamp: z.iso.datetime(),
})

export const errorDetailSchema = z.record(z.string(), z.array(z.string())).optional()

export const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string().min(1),
    details: errorDetailSchema,
    message: z.string().min(1),
  }),
  meta: responseMetaSchema,
})

export const livenessDataSchema = z.object({
  service: z.string().min(1),
  status: z.enum(['alive', 'ok']),
})

export const readinessComponentSchema = z.object({
  message: z.string().optional(),
  name: z.string().min(1),
  status: z.enum(['ready', 'not-ready']),
})

export const readinessDataSchema = z.object({
  components: z.array(readinessComponentSchema),
  status: z.enum(['ready', 'not-ready']),
})

export const moduleSummarySchema = z.object({
  capabilities: z.array(z.string()),
  id: z.string().min(1),
  version: z.string().min(1),
})

export const systemRuntimeDataSchema = z.object({
  modules: z.array(moduleSummarySchema),
  platformVersion: z.string().min(1),
})

export function successEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: responseMetaSchema,
  })
}

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>
export type LivenessData = z.infer<typeof livenessDataSchema>
export type ReadinessComponent = z.infer<typeof readinessComponentSchema>
export type ReadinessData = z.infer<typeof readinessDataSchema>
export type ResponseMeta = z.infer<typeof responseMetaSchema>
export type SystemRuntimeData = z.infer<typeof systemRuntimeDataSchema>
