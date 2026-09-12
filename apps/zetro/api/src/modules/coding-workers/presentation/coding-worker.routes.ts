import {
  codingWorkerAttemptListResponseSchema,
  codingWorkerAttemptParamsSchema,
  codingWorkerAttemptSchema,
  codingWorkerApprovalRequestSchema,
  codingWorkerHandoffRequestSchema,
  codingWorkerLifecycleRequestSchema,
} from '@codexsun/zetro-contracts'
import type { FastifyInstance } from 'fastify'
import { CodingWorkerService } from '../application/coding-worker.service.js'

export async function registerCodingWorkerRoutes(
  server: FastifyInstance,
  service: CodingWorkerService,
) {
  server.get('/api/zetro/v1/coding-workers', async () =>
    codingWorkerAttemptListResponseSchema.parse({ attempts: service.list() }),
  )
  server.post('/api/zetro/v1/coding-workers/prepare', async (request, reply) => {
    const input = codingWorkerHandoffRequestSchema.safeParse(request.body)
    if (!input.success) {
      return reply
        .code(400)
        .send({ error: 'Task, scope, criteria, checks, and review confirmation are required.' })
    }
    try {
      return reply.code(201).send(codingWorkerAttemptSchema.parse(service.prepare(input.data)))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Worker handoff could not be prepared.'
      return reply.code(409).send({ error: message })
    }
  })
  server.post('/api/zetro/v1/coding-workers/:attemptId/verify', async (request, reply) => {
    const params = codingWorkerAttemptParamsSchema.safeParse(request.params)
    if (!params.success)
      return reply.code(400).send({ error: 'A valid worker attempt is required.' })
    try {
      return reply
        .code(200)
        .send(codingWorkerAttemptSchema.parse(service.verify(params.data.attemptId)))
    } catch (error) {
      return reply.code(409).send({ error: messageFrom(error) })
    }
  })
  server.post('/api/zetro/v1/coding-workers/:attemptId/start', async (request, reply) => {
    const params = codingWorkerAttemptParamsSchema.safeParse(request.params)
    if (!params.success)
      return reply.code(400).send({ error: 'A valid worker attempt is required.' })
    try {
      return reply
        .code(202)
        .send(codingWorkerAttemptSchema.parse(service.start(params.data.attemptId)))
    } catch (error) {
      return reply.code(409).send({ error: messageFrom(error) })
    }
  })
  server.post('/api/zetro/v1/coding-workers/:attemptId/stop', async (request, reply) => {
    const params = codingWorkerAttemptParamsSchema.safeParse(request.params)
    if (!params.success)
      return reply.code(400).send({ error: 'A valid worker attempt is required.' })
    try {
      return reply.code(202).send(codingWorkerAttemptSchema.parse(service.stop(params.data.attemptId)))
    } catch (error) {
      return reply.code(409).send({ error: messageFrom(error) })
    }
  })
  server.post('/api/zetro/v1/coding-workers/:attemptId/approve', async (request, reply) => {
    const params = codingWorkerAttemptParamsSchema.safeParse(request.params)
    const body = codingWorkerApprovalRequestSchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.code(400).send({ error: 'Explicit approval confirmation is required.' })
    }
    try {
      return reply
        .code(200)
        .send(codingWorkerAttemptSchema.parse(service.approve(params.data.attemptId)))
    } catch (error) {
      return reply.code(409).send({ error: messageFrom(error) })
    }
  })
  server.post('/api/zetro/v1/coding-workers/:attemptId/reject', async (request, reply) => {
    const params = codingWorkerAttemptParamsSchema.safeParse(request.params)
    const body = codingWorkerApprovalRequestSchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.code(400).send({ error: 'Explicit rejection confirmation is required.' })
    }
    try {
      return reply
        .code(200)
        .send(codingWorkerAttemptSchema.parse(service.reject(params.data.attemptId)))
    } catch (error) {
      return reply.code(409).send({ error: messageFrom(error) })
    }
  })
  for (const action of ['archive', 'cleanup', 'integrate'] as const) {
    server.post(`/api/zetro/v1/coding-workers/:attemptId/${action}`, async (request, reply) => {
      const params = codingWorkerAttemptParamsSchema.safeParse(request.params)
      const body = codingWorkerLifecycleRequestSchema.safeParse(request.body)
      if (!params.success || !body.success) {
        return reply.code(400).send({ error: 'Explicit lifecycle confirmation is required.' })
      }
      try {
        return reply.code(200).send(codingWorkerAttemptSchema.parse(service[action](params.data.attemptId)))
      } catch (error) {
        return reply.code(409).send({ error: messageFrom(error) })
      }
    })
  }
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : 'Coding worker action could not be completed.'
}
