import {
  cloudTargetSchema,
  cloudTargetUpdateSchema,
  deploymentEvidenceSchema,
  deploymentRecordCreateSchema,
  deploymentRecordListSchema,
  deploymentRecordSchema,
  dockerContainerActionRequestSchema,
  dockerContainerActionResponseSchema,
  dockerContainerListSchema,
  orchestrationErrorSchema,
  orchestrationOverviewSchema,
  prerequisiteOverviewSchema,
  prerequisiteSettingsSchema,
  prerequisiteSettingsUpdateSchema,
  prerequisiteSourceFileSchema,
  prerequisiteSourceSchema,
  prerequisiteSourceUpdateSchema,
  prerequisiteBuildRequestSchema,
  prerequisiteBuildResponseSchema,
  serviceActionRequestSchema,
  serviceActionResponseSchema,
  serviceLogsResponseSchema,
  runtimeFailureOverviewSchema,
  availableApplicationsSchema,
  appInstallationRequestSchema,
  appInstallationResultSchema,
} from '@codexsun/orship-contracts'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { OrchestrationError, OrchestrationService } from '../application/orchestration.service.js'
import { CloudTargetService } from '../application/cloud-target.service.js'
import { DeploymentEvidenceService } from '../application/deployment-evidence.service.js'
import { DockerControlGateway } from '../infrastructure/docker-control.gateway.js'
import { PrerequisiteService } from '../application/prerequisite.service.js'
import { AppInstallerService } from '../application/app-installer.service.js'
import { PrerequisiteSettingsStore } from '../infrastructure/prerequisite-settings.store.js'
import { PrerequisiteSourceStore } from '../infrastructure/prerequisite-source.store.js'

const serviceParamsSchema = z.strictObject({ serviceId: z.string().min(1).max(80) })
const logQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(500).default(160),
})

export async function registerOrchestrationRoutes(
  server: FastifyInstance,
  service: OrchestrationService,
  cloudTarget: CloudTargetService,
  deployments: DeploymentEvidenceService,
  docker: DockerControlGateway,
  prerequisites: PrerequisiteService,
  appInstaller: AppInstallerService,
  prerequisiteSettings: PrerequisiteSettingsStore,
  prerequisiteSource: PrerequisiteSourceStore,
): Promise<void> {
  server.get(
    '/api/orship/v1/prerequisites',
    { schema: { response: { 200: z.toJSONSchema(prerequisiteOverviewSchema) } } },
    () => prerequisites.getOverview(),
  )

  server.get(
    '/api/orship/v1/prerequisites/settings',
    { schema: { response: { 200: z.toJSONSchema(prerequisiteSettingsSchema) } } },
    () => prerequisiteSettings.get(),
  )

  server.put(
    '/api/orship/v1/prerequisites/settings',
    {
      schema: {
        response: {
          200: z.toJSONSchema(prerequisiteSettingsSchema),
          403: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request)) {
        return reply.status(403).send(errorBody('LOOPBACK_REQUIRED', 'Use a local browser.'))
      }
      return prerequisiteSettings.update(prerequisiteSettingsUpdateSchema.parse(request.body))
    },
  )

  server.get(
    '/api/orship/v1/prerequisites/source/:file',
    { schema: { response: { 200: z.toJSONSchema(prerequisiteSourceSchema) } } },
    (request) =>
      prerequisiteSource.get(
        prerequisiteSourceFileSchema.parse((request.params as { file?: unknown }).file),
      ),
  )

  server.put(
    '/api/orship/v1/prerequisites/source/:file',
    {
      schema: {
        response: {
          200: z.toJSONSchema(prerequisiteSourceSchema),
          403: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request)) {
        return reply.status(403).send(errorBody('LOOPBACK_REQUIRED', 'Use a local browser.'))
      }
      const file = prerequisiteSourceFileSchema.parse(
        (request.params as { file?: unknown }).file,
      )
      const input = prerequisiteSourceUpdateSchema.parse(request.body)
      return prerequisiteSource.update(file, input.content)
    },
  )

  server.post(
    '/api/orship/v1/prerequisites/build',
    {
      schema: {
        body: z.toJSONSchema(prerequisiteBuildRequestSchema),
        response: {
          200: z.toJSONSchema(prerequisiteBuildResponseSchema),
          403: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request)) {
        return reply.status(403).send(errorBody('LOOPBACK_REQUIRED', 'Use a local browser.'))
      }
      const input = prerequisiteBuildRequestSchema.parse(request.body)
      return prerequisites.build({ forceRebuild: input.forceRebuild })
    },
  )

  server.get(
    '/api/orship/v1/applications',
    { schema: { response: { 200: z.toJSONSchema(availableApplicationsSchema) } } },
    () => appInstaller.getAvailableApplications(),
  )

  server.post(
    '/api/orship/v1/applications/install',
    {
      schema: {
        body: z.toJSONSchema(appInstallationRequestSchema),
        response: {
          200: z.toJSONSchema(appInstallationResultSchema),
          403: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request)) {
        return reply.status(403).send(errorBody('LOOPBACK_REQUIRED', 'Use a local browser.'))
      }
      const input = appInstallationRequestSchema.parse(request.body)
      return appInstaller.install(input)
    },
  )

  server.post(
    '/api/orship/v1/applications/deploy',
    {
      schema: {
        body: z.strictObject({ profileId: z.string().min(1).max(120) }),
        response: {
          200: z.toJSONSchema(appInstallationResultSchema),
          403: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request)) {
        return reply.status(403).send(errorBody('LOOPBACK_REQUIRED', 'Use a local browser.'))
      }
      const { profileId } = z.strictObject({ profileId: z.string().min(1).max(120) }).parse(request.body)
      return appInstaller.deploy(profileId)
    },
  )

  server.get(
    '/api/orship/v1/docker/containers',
    { schema: { response: { 200: z.toJSONSchema(dockerContainerListSchema) } } },
    () => docker.list(),
  )

  server.post(
    '/api/orship/v1/docker/containers/:containerId/actions',
    {
      schema: {
        response: {
          200: z.toJSONSchema(dockerContainerActionResponseSchema),
          403: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request)) {
        return reply.status(403).send(errorBody('LOOPBACK_REQUIRED', 'Use a local browser.'))
      }
      const { serviceId: containerId } = serviceParamsSchema.parse({
        serviceId: (request.params as { containerId?: unknown }).containerId,
      })
      const { action } = dockerContainerActionRequestSchema.parse(request.body)
      return docker.act(containerId, action)
    },
  )
  server.get(
    '/api/orship/v1/deployments/platform/evidence',
    { schema: { response: { 200: z.toJSONSchema(deploymentEvidenceSchema) } } },
    () => deployments.getEvidence(),
  )

  server.get(
    '/api/orship/v1/deployments/platform/records',
    { schema: { response: { 200: z.toJSONSchema(deploymentRecordListSchema) } } },
    () => deployments.listRecords(),
  )

  server.post(
    '/api/orship/v1/deployments/platform/records',
    {
      schema: {
        response: {
          200: z.toJSONSchema(deploymentRecordSchema),
          403: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request)) {
        return reply.status(403).send(errorBody('LOOPBACK_REQUIRED', 'Use a local browser.'))
      }
      return deployments.createRecord(deploymentRecordCreateSchema.parse(request.body))
    },
  )

  server.get(
    '/api/orship/v1/failures',
    { schema: { response: { 200: z.toJSONSchema(runtimeFailureOverviewSchema) } } },
    async (request) => {
      const { limit } = logQuerySchema.parse(request.query)
      return service.getFailures(limit)
    },
  )

  server.get(
    '/api/orship/v1/cloud-target',
    { schema: { response: { 200: z.toJSONSchema(cloudTargetSchema) } } },
    () => cloudTarget.get(),
  )

  server.put(
    '/api/orship/v1/cloud-target',
    {
      schema: {
        response: {
          200: z.toJSONSchema(cloudTargetSchema),
          403: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request)) {
        return reply.status(403).send(errorBody('LOOPBACK_REQUIRED', 'Use a local browser.'))
      }
      return cloudTarget.update(cloudTargetUpdateSchema.parse(request.body))
    },
  )

  server.get(
    '/api/orship/v1/services',
    { schema: { response: { 200: z.toJSONSchema(orchestrationOverviewSchema) } } },
    () => service.getOverview(),
  )

  server.get(
    '/api/orship/v1/services/:serviceId/logs',
    {
      schema: {
        response: {
          200: z.toJSONSchema(serviceLogsResponseSchema),
          400: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request) => {
      const { serviceId } = serviceParamsSchema.parse(request.params)
      const { limit } = logQuerySchema.parse(request.query)
      return service.getLogs(serviceId, limit)
    },
  )

  server.post(
    '/api/orship/v1/services/:serviceId/actions',
    {
      schema: {
        response: {
          200: z.toJSONSchema(serviceActionResponseSchema),
          400: z.toJSONSchema(orchestrationErrorSchema),
          403: z.toJSONSchema(orchestrationErrorSchema),
          404: z.toJSONSchema(orchestrationErrorSchema),
          409: z.toJSONSchema(orchestrationErrorSchema),
        },
      },
    },
    async (request, reply) => {
      if (!isLoopback(request)) {
        return reply.status(403).send(errorBody('LOOPBACK_REQUIRED', 'Use a local browser.'))
      }
      const { serviceId } = serviceParamsSchema.parse(request.params)
      const { action } = serviceActionRequestSchema.parse(request.body)
      try {
        return await service.runAction(serviceId, action)
      } catch (error) {
        if (!(error instanceof OrchestrationError)) throw error
        return reply
          .status(normalizeStatus(error.statusCode))
          .send(errorBody(error.code, error.message))
      }
    },
  )
}

function isLoopback(request: FastifyRequest): boolean {
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.ip)
}

function normalizeStatus(statusCode: number): 403 | 404 | 409 {
  return statusCode === 403 || statusCode === 404 ? statusCode : 409
}

function errorBody(code: string, message: string) {
  return { error: { code, message } }
}
