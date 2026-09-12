import { runbookArchiveRequestSchema, runbookCreateRequestSchema, runbookEnabledRequestSchema, runbookInitiateRequestSchema, runbookInitiationResponseSchema, runbookListResponseSchema, runbookParamsSchema, runbookRunListResponseSchema, runbookRunParamsSchema, runbookRunSchema, runbookSchema } from '@codexsun/zetro-contracts'
import type { FastifyInstance } from 'fastify'
import type { RunbookService } from '../application/runbook.service.js'

export async function registerRunbookRoutes(server: FastifyInstance, service: RunbookService) {
  server.get('/api/zetro/v1/runbooks', async () => runbookListResponseSchema.parse({ runbooks: service.list() }))
  server.get('/api/zetro/v1/runbook-runs', async () => runbookRunListResponseSchema.parse({ runs: service.listRuns() }))
  server.post('/api/zetro/v1/runbook-initiations', async (request, reply) => {
    const input = runbookInitiateRequestSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'A runbook, initiator module and item, and matching mode are required.' })
    try { return reply.code(202).send(runbookInitiationResponseSchema.parse(service.initiate(input.data))) } catch (error) { return reply.code(409).send({ error: message(error) }) }
  })
  server.post('/api/zetro/v1/runbooks', async (request, reply) => {
    const input = runbookCreateRequestSchema.safeParse(request.body)
    if (!input.success) return reply.code(400).send({ error: 'Title, prompt, repository, module, and a 15-minute schedule are required.' })
    try { return reply.code(201).send(runbookSchema.parse(service.create(input.data))) } catch (error) { return reply.code(409).send({ error: message(error) }) }
  })
  server.post('/api/zetro/v1/runbooks/:runbookId/start', async (request, reply) => {
    const params = runbookParamsSchema.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'A valid runbook is required.' })
    try { return reply.code(202).send(runbookRunSchema.parse(service.start(params.data.runbookId))) } catch (error) { return reply.code(409).send({ error: message(error) }) }
  })
  server.post('/api/zetro/v1/runbook-runs/:runId/stop', async (request, reply) => {
    const params = runbookRunParamsSchema.safeParse(request.params)
    if (!params.success) return reply.code(400).send({ error: 'A valid run is required.' })
    try { return reply.send(runbookRunSchema.parse(service.stop(params.data.runId))) } catch (error) { return reply.code(409).send({ error: message(error) }) }
  })
  server.patch('/api/zetro/v1/runbooks/:runbookId', async (request, reply) => {
    const params = runbookParamsSchema.safeParse(request.params); const input = runbookEnabledRequestSchema.safeParse(request.body)
    if (!params.success || !input.success) return reply.code(400).send({ error: 'A valid runbook and enabled state are required.' })
    try { return reply.send(runbookSchema.parse(service.setEnabled(params.data.runbookId, input.data.enabled))) } catch (error) { return reply.code(404).send({ error: message(error) }) }
  })
  server.patch('/api/zetro/v1/runbooks/:runbookId/archive', async (request, reply) => {
    const params = runbookParamsSchema.safeParse(request.params); const input = runbookArchiveRequestSchema.safeParse(request.body)
    if (!params.success || !input.success) return reply.code(400).send({ error: 'A valid runbook archive state is required.' })
    try { return reply.send(runbookSchema.parse(service.archive(params.data.runbookId, input.data.archived))) } catch (error) { return reply.code(409).send({ error: message(error) }) }
  })
}
function message(error: unknown) { return error instanceof Error ? error.message : 'Runbook action could not be completed.' }
