import { z } from 'zod'

export const serviceKindSchema = z.enum(['api', 'web', 'worker'])
export const serviceStateSchema = z.enum(['online', 'degraded', 'offline'])
export const serviceActionSchema = z.enum(['start', 'stop'])

const cloudRepositorySchema = z.object({
  branch: z
    .string()
    .regex(/^[A-Za-z0-9._/-]+$/u)
    .max(160),
  url: z.string().min(1).max(500),
})

const cloudVpsSchema = z.object({
  deploymentPath: z.string().regex(/^\//u).max(500),
  host: z.string().min(1).max(253),
  port: z.number().int().min(1).max(65_535),
  user: z
    .string()
    .regex(/^[A-Za-z_][A-Za-z0-9_-]*$/u)
    .max(64),
})

export const cloudTargetUpdateSchema = z
  .strictObject({
    localWorkspacePath: z.string().min(1).max(500),
    name: z.string().min(1).max(100),
    repository: cloudRepositorySchema,
    targetType: z.enum(['local-docker', 'vps']),
    vps: cloudVpsSchema.nullable(),
  })
  .superRefine((target, context) => {
    if (target.targetType === 'vps' && !target.vps) {
      context.addIssue({
        code: 'custom',
        message: 'A VPS target needs connection details.',
        path: ['vps'],
      })
    }
  })

export const cloudTargetSchema = z.object({
  configured: z.boolean(),
  localWorkspacePath: z.string().max(500).nullable(),
  name: z.string().max(100).nullable(),
  repository: cloudRepositorySchema.nullable(),
  sshKeyConfigured: z.boolean(),
  targetType: z.enum(['local-docker', 'vps']).nullable(),
  vps: cloudVpsSchema.nullable(),
})

export const deploymentActionSchema = z.enum(['verify', 'pull', 'prepare', 'deploy'])
export const deploymentStatusSchema = z.enum([
  'prepared',
  'command-copied',
  'awaiting-verification',
  'verified',
  'failed',
])
export const deploymentTargetTypeSchema = z.enum(['local-docker', 'vps'])

const deploymentFileSchema = z.object({
  exists: z.boolean(),
  kind: z.enum(['source', 'generated']),
  modifiedAt: z.iso.datetime().nullable(),
  path: z.string().min(1).max(500),
})

const deploymentRepositorySchema = z.object({
  branch: z.string().min(1).max(160),
  commit: z.string().min(1).max(80),
  dirty: z.boolean(),
  path: z.string().min(1).max(500),
  url: z.string().max(500).nullable(),
})

const deploymentCommandSchema = z.object({
  action: deploymentActionSchema,
  command: z.string().min(1).max(1_000),
  expectedFiles: z.array(deploymentFileSchema),
  requiredFiles: z.array(deploymentFileSchema),
  title: z.string().min(1).max(200),
})

export const deploymentEvidenceSchema = z.object({
  applicationId: z.literal('platform'),
  commands: z.array(deploymentCommandSchema),
  profile: z.literal('platform-only'),
  repository: deploymentRepositorySchema,
  serviceIds: z.array(z.string().min(1)).min(1),
  targetId: z.literal('local-docker'),
  targetType: z.literal('local-docker'),
})

export const deploymentRecordSchema = z.object({
  action: deploymentActionSchema,
  applicationId: z.literal('platform'),
  artifactFiles: z.array(deploymentFileSchema),
  command: z.string().min(1).max(1_000),
  completedAt: z.iso.datetime().nullable(),
  exitCode: z.number().int().min(-1).max(255).nullable(),
  id: z.string().uuid(),
  output: z.string().max(50_000),
  profile: z.literal('platform-only'),
  repository: deploymentRepositorySchema,
  serviceIds: z.array(z.string().min(1)).min(1),
  startedAt: z.iso.datetime(),
  status: deploymentStatusSchema,
  targetId: z.literal('local-docker'),
})

export const deploymentRecordCreateSchema = z.strictObject({
  action: deploymentActionSchema,
  exitCode: z.number().int().min(-1).max(255).nullable(),
  output: z.string().max(50_000),
  status: deploymentStatusSchema,
})

export const deploymentRecordListSchema = z.object({
  records: z.array(deploymentRecordSchema),
})

export const serviceSnapshotSchema = z.object({
  applicationId: z.string().min(1),
  checkedAt: z.iso.datetime(),
  controllable: z.boolean(),
  cpuSeconds: z.number().nonnegative().nullable(),
  healthUrl: z.url(),
  healthy: z.boolean(),
  id: z.string().min(1),
  kind: serviceKindSchema,
  latencyMs: z.number().int().nonnegative().nullable(),
  logsAvailable: z.boolean(),
  memoryBytes: z.number().int().nonnegative().nullable(),
  pid: z.number().int().positive().nullable(),
  port: z.number().int().min(6000).max(6999),
  protected: z.boolean(),
  state: serviceStateSchema,
  uptimeSeconds: z.number().int().nonnegative().nullable(),
})

export const orchestrationSummarySchema = z.object({
  degraded: z.number().int().nonnegative(),
  offline: z.number().int().nonnegative(),
  online: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
})

export const orchestrationOverviewSchema = z.object({
  checkedAt: z.iso.datetime(),
  services: z.array(serviceSnapshotSchema),
  summary: orchestrationSummarySchema,
})

export const serviceActionRequestSchema = z.strictObject({
  action: serviceActionSchema,
})

export const serviceActionResponseSchema = z.object({
  message: z.string().min(1),
  service: serviceSnapshotSchema,
})

export const serviceLogsResponseSchema = z.object({
  lines: z.array(z.string()),
  serviceId: z.string().min(1),
  updatedAt: z.iso.datetime(),
})

export const runtimeFailureSchema = z.object({
  application: z.string().min(1),
  component: z.string().min(1),
  correlationId: z.string().optional(),
  event: z.string().min(1),
  level: z.number().int().min(40).max(60),
  msg: z.string().min(1),
  requestId: z.string().optional(),
  time: z.iso.datetime(),
})

export const runtimeFailureOverviewSchema = z.object({
  failures: z.array(runtimeFailureSchema),
  total: z.number().int().nonnegative(),
  updatedAt: z.iso.datetime(),
})

export const orchestrationErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
})

export type OrchestrationOverview = z.infer<typeof orchestrationOverviewSchema>
export type ServiceAction = z.infer<typeof serviceActionSchema>
export type ServiceActionResponse = z.infer<typeof serviceActionResponseSchema>
export type ServiceLogsResponse = z.infer<typeof serviceLogsResponseSchema>
export type RuntimeFailure = z.infer<typeof runtimeFailureSchema>
export type RuntimeFailureOverview = z.infer<typeof runtimeFailureOverviewSchema>
export type ServiceSnapshot = z.infer<typeof serviceSnapshotSchema>
export type CloudTarget = z.infer<typeof cloudTargetSchema>
export type CloudTargetUpdate = z.infer<typeof cloudTargetUpdateSchema>
export type DeploymentAction = z.infer<typeof deploymentActionSchema>
export type DeploymentEvidence = z.infer<typeof deploymentEvidenceSchema>
export type DeploymentRecord = z.infer<typeof deploymentRecordSchema>
export type DeploymentRecordCreate = z.infer<typeof deploymentRecordCreateSchema>
export type DeploymentRecordList = z.infer<typeof deploymentRecordListSchema>
export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>
