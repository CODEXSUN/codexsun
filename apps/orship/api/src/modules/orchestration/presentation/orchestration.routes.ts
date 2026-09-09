import {
  cloudTargetSchema,
  cloudTargetUpdateSchema,
  deploymentEvidenceSchema,
  deploymentRecordCreateSchema,
  deploymentRecordListSchema,
  deploymentRecordSchema,
  orchestrationErrorSchema,
  orchestrationOverviewSchema,
  serviceActionRequestSchema,
  serviceActionResponseSchema,
  serviceLogsResponseSchema,
  runtimeFailureOverviewSchema,
} from '@codexsun/orship-contracts'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { OrchestrationError, OrchestrationService } from '../application/orchestration.service.js'
import { CloudTargetService } from '../application/cloud-target.service.js'
import { DeploymentEvidenceService } from '../application/deployment-evidence.service.js'

const serviceParamsSchema = z.strictObject({ serviceId: z.string().min(1).max(80) })
const logQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(500).default(160),
})

export async function registerOrchestrationRoutes(
  server: FastifyInstance,
  service: OrchestrationService,
  cloudTarget: CloudTargetService,
  deployments: DeploymentEvidenceService,
): Promise<void> {
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
