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

export const dockerContainerStateSchema = z.enum([
  'created',
  'running',
  'paused',
  'restarting',
  'exited',
])
export const dockerContainerActionSchema = z.enum(['start', 'stop', 'restart'])

export const dockerContainerSchema = z.object({
  createdAt: z.iso.datetime(),
  id: z.string().min(12).max(128),
  image: z.string().min(1).max(500),
  name: z.string().min(1).max(255),
  ports: z.array(z.string().max(160)),
  state: dockerContainerStateSchema,
  status: z.string().min(1).max(500),
})

export const dockerContainerListSchema = z.object({
  available: z.boolean(),
  containers: z.array(dockerContainerSchema),
  reason: z.string().max(300).nullable(),
  updatedAt: z.iso.datetime(),
})

export const dockerContainerActionRequestSchema = z.strictObject({
  action: dockerContainerActionSchema,
})

export const dockerContainerActionResponseSchema = z.object({
  container: dockerContainerSchema,
  message: z.string().min(1).max(300),
})

export const prerequisiteStateSchema = z.enum(['healthy', 'starting', 'unavailable'])

export const prerequisiteServiceSchema = z.object({
  id: z.enum(['mariadb', 'redis', 'filebrowser']),
  name: z.string().min(1).max(80),
  state: prerequisiteStateSchema,
  status: z.string().min(1).max(300),
})

export const prerequisiteOverviewSchema = z.object({
  available: z.boolean(),
  services: z.array(prerequisiteServiceSchema),
  updatedAt: z.iso.datetime(),
})

export const prerequisiteSettingsSchema = z.object({
  fileBrowserImage: z.string().min(1).max(200),
  fileBrowserTag: z.string().min(1).max(100),
  fileBrowserAdminConfigured: z.boolean(),
  fileBrowserAdminUser: z.string().min(1).max(80),
  mariadbImage: z.string().min(1).max(200),
  mariadbPort: z.number().int().min(1).max(65535),
  mariadbRootPasswordConfigured: z.boolean(),
  mariadbTag: z.string().min(1).max(100),
  mariadbUser: z.string().min(1).max(80),
  mariadbUserPasswordConfigured: z.boolean(),
  networkName: z.string().min(1).max(100),
  redisImage: z.string().min(1).max(200),
  redisPasswordConfigured: z.boolean(),
  redisPort: z.number().int().min(1).max(65535),
  redisTag: z.string().min(1).max(100),
  redisUser: z.string().min(1).max(80),
  storagePort: z.number().int().min(1).max(65535),
})

export const prerequisiteSettingsUpdateSchema = z.strictObject({
  fileBrowserImage: z.string().min(1).max(200),
  fileBrowserTag: z.string().min(1).max(100),
  fileBrowserAdminPassword: z.string().min(12).max(300).optional(),
  fileBrowserAdminUser: z.string().min(1).max(80),
  mariadbImage: z.string().min(1).max(200),
  mariadbPort: z.number().int().min(1).max(65535),
  mariadbRootPassword: z.string().min(12).max(300).optional(),
  mariadbTag: z.string().min(1).max(100),
  mariadbUser: z.string().min(1).max(80),
  mariadbUserPassword: z.string().min(12).max(300).optional(),
  networkName: z.string().min(1).max(100),
  redisImage: z.string().min(1).max(200),
  redisPassword: z.string().min(12).max(300).optional(),
  redisPort: z.number().int().min(1).max(65535),
  redisTag: z.string().min(1).max(100),
  redisUser: z.string().min(1).max(80),
  storagePort: z.number().int().min(1).max(65535),
})

export const prerequisiteSourceFileSchema = z.enum([
  'compose',
  'dockerfile',
  'filebrowser-init',
])

export const prerequisiteSourceSchema = z.object({
  content: z.string().max(100_000),
  file: prerequisiteSourceFileSchema,
  updatedAt: z.iso.datetime(),
})

export const prerequisiteSourceUpdateSchema = z.strictObject({
  content: z.string().min(1).max(100_000).refine((value) => !value.includes('\0'), {
    message: 'Source content cannot contain null characters.',
  }),
})

export const prerequisiteBuildRequestSchema = z.strictObject({
  forceRebuild: z.boolean().default(false),
})

export const prerequisiteBuildResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  output: z.string().max(50_000).optional(),
  exitCode: z.number().int().nullable(),
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
export type DockerContainer = z.infer<typeof dockerContainerSchema>
export type DockerContainerAction = z.infer<typeof dockerContainerActionSchema>
export type DockerContainerActionResponse = z.infer<typeof dockerContainerActionResponseSchema>
export type DockerContainerList = z.infer<typeof dockerContainerListSchema>
export type PrerequisiteOverview = z.infer<typeof prerequisiteOverviewSchema>
export type PrerequisiteSettings = z.infer<typeof prerequisiteSettingsSchema>
export type PrerequisiteSettingsUpdate = z.infer<typeof prerequisiteSettingsUpdateSchema>
export type PrerequisiteSource = z.infer<typeof prerequisiteSourceSchema>
export type PrerequisiteSourceFile = z.infer<typeof prerequisiteSourceFileSchema>
export type PrerequisiteSourceUpdate = z.infer<typeof prerequisiteSourceUpdateSchema>
export type PrerequisiteBuildRequest = z.infer<typeof prerequisiteBuildRequestSchema>
export type PrerequisiteBuildResponse = z.infer<typeof prerequisiteBuildResponseSchema>
export type AppInstallation = z.infer<typeof appInstallationSchema>
export type AppInstallationRequest = z.infer<typeof appInstallationRequestSchema>
export type AppInstallationResult = z.infer<typeof appInstallationResultSchema>
export type AvailableApplication = z.infer<typeof availableApplicationSchema>
export type AvailableApplications = z.infer<typeof availableApplicationsSchema>

export const appInstallationSchema = z.strictObject({
  applicationId: z.string().min(1).max(80),
  customerId: z.string().min(1).max(80),
  profileId: z.string().min(1).max(80),
  selectedAddons: z.array(z.string().min(1).max(80)).default([]),
  portOverrides: z.record(z.string().min(1).max(80), z.number().int().min(6000).max(6999)).default({}),
  environment: z.enum(['development', 'production']).default('development'),
})

export const appInstallationRequestSchema = z.strictObject({
  applicationId: z.string().min(1).max(80),
  customerId: z.string().min(1).max(80),
  selectedAddons: z.array(z.string().min(1).max(80)).default([]),
  portOverrides: z.record(z.string().min(1).max(80), z.number().int().min(6000).max(6999)).default({}),
  environment: z.enum(['development', 'production']).default('development'),
})

export const appInstallationResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  profileId: z.string().optional(),
  composePath: z.string().optional(),
  output: z.string().max(50_000).optional(),
  exitCode: z.number().int().nullable(),
})

export const availableApplicationSchema = z.object({
  id: z.string().min(1).max(80),
  version: z.string().min(1),
  requires: z.array(z.string().min(1).max(80)),
  components: z.array(z.object({
    id: z.string().min(1).max(80),
    name: z.string().min(1).max(80),
    kind: z.enum(['api', 'web', 'worker']),
    runtime: z.enum(['node', 'static']),
    defaultPort: z.number().int().min(6000).max(6999),
    dependsOn: z.array(z.string().min(1).max(80)),
  })),
  availableAddons: z.array(z.object({
    id: z.string().min(1).max(80),
    version: z.string().min(1),
    targetApplication: z.string().min(1).max(80),
    componentIds: z.array(z.string().min(1).max(80)),
    requires: z.array(z.string().min(1).max(80)),
  })),
})

export const availableApplicationsSchema = z.object({
  applications: z.array(availableApplicationSchema),
})
