import type { FastifyInstance } from 'fastify'
import type { AgentCrewEnvironment } from '../../config.js'
import { createRunSchema } from './crew-control.schema.js'
import { CrewRunnerClient } from './crew-control.service.js'

export async function registerCrewControlModule(
  server: FastifyInstance,
  environment: AgentCrewEnvironment,
) {
  const runner = new CrewRunnerClient(environment)
  server.get('/api/agent-crew/overview', async (_request, reply) => {
    try {
      return await runner.overview()
    } catch (error) {
      return reply.code(503).send({ error: errorMessage(error), status: 'worker-unavailable' })
    }
  })
  server.post('/api/agent-crew/runs', async (request, reply) => {
    const parsed = createRunSchema.safeParse(request.body)
    if (!parsed.success)
      return reply.code(400).send({ error: 'Provide a valid provider, workspace ID, and prompt.' })
    try {
      return await runner.run(parsed.data)
    } catch (error) {
      return reply.code(502).send({ error: errorMessage(error) })
    }
  })
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The Agent Crew worker did not return a safe response.'
}
