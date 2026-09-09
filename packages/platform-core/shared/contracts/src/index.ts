import { z } from 'zod'

export * from './identity.js'

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
  moduleId: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(['ready', 'not-ready']),
})

export const readinessDataSchema = z.object({
  components: z.array(readinessComponentSchema),
  status: z.enum(['ready', 'not-ready']),
})

export const readinessErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  data: readinessDataSchema,
  error: z.object({
    code: z.literal('SERVICE_NOT_READY'),
    message: z.string().min(1),
  }),
  meta: responseMetaSchema,
})

export const moduleSummarySchema = z.object({
  capabilities: z.array(z.string()),
  consumes: z.array(z.object({ id: z.string().min(1), versionRange: z.string().min(1) })),
  extensionPoints: z.array(
    z.object({
      cardinality: z.enum(['many', 'one']),
      id: z.string().min(1),
      version: z.string().min(1),
    }),
  ),
  id: z.string().min(1),
  kind: z.enum(['adapter', 'addon', 'core', 'feature']),
  owner: z.string().min(1),
  publicContracts: z.array(z.object({ id: z.string().min(1), version: z.string().min(1) })),
  publishes: z.array(z.object({ id: z.string().min(1), version: z.string().min(1) })),
  version: z.string().min(1),
})

export const diagnosticEventSchema = z.object({
  code: z.string().min(1),
  correlationId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  level: z.enum(['error', 'info', 'warn']),
  message: z.string().min(1),
  moduleId: z.string().optional(),
  timestamp: z.iso.datetime(),
})

export const systemRuntimeDataSchema = z.object({
  diagnostics: z.array(diagnosticEventSchema),
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
