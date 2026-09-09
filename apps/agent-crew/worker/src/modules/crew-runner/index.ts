import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { RunnerEnvironment } from '../../config.js'
import { CrewRunnerService } from './crew-runner.service.js'

const runSchema = z.object({
  model: z.string().trim().max(160).optional(),
  prompt: z.string().trim().min(1).max(20_000),
  provider: z.enum(['codex', 'opencode', 'ollama']),
  workspaceId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/),
})

export async function registerCrewRunner(server: FastifyInstance, environment: RunnerEnvironment) {
  const service = new CrewRunnerService(environment)
  server.addHook('preHandler', async (request, reply) => {
    if (request.headers.authorization === `Bearer ${environment.AGENT_CREW_RUNNER_TOKEN}`) return
    return reply.code(401).send({ error: 'Worker authentication is required.' })
  })
  server.get('/internal/health', async () => ({ service: 'agent-crew-worker', status: 'ok' }))
  server.get('/internal/overview', async () => service.overview())
  server.post('/internal/runs', async (request, reply) => {
    const parsed = runSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.code(400).send({ error: 'Provide a valid isolated run request.' })
    try {
      return await service.run(parsed.data)
    } catch (error) {
      return reply
        .code(502)
        .send({ error: error instanceof Error ? error.message : 'Provider execution failed.' })
    }
  })
}
