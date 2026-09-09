import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import underPressure from '@fastify/under-pressure'
import { ModuleRegistry } from '@codexsun/framework'
import { PlatformApiObservability } from '@codexsun/platform-core-api'
import Fastify, { type FastifyInstance } from 'fastify'
import { ZodError, z } from 'zod'
import { getProjectRoot, readEnvironment, type OrshipEnvironment } from './config.js'
import {
  orchestrationManifest,
  registerOrchestrationModule,
} from './modules/orchestration/index.js'

export async function buildOrshipApi(
  environment: OrshipEnvironment = readEnvironment(),
  observability = new PlatformApiObservability({
    application: 'orship',
    component: 'orship-api',
  }),
): Promise<FastifyInstance> {
  observability.start()
  const registry = new ModuleRegistry()
  registry.register(orchestrationManifest)
  registry.createCompositionPlan('0.1.0')

  const server = Fastify(observability.fastifyOptions())
  observability.register(server)
  server.addHook('onClose', () => observability.shutdown())
  await server.register(sensible)
  await server.register(helmet)
  await server.register(cors, {
    origin: `http://127.0.0.1:${environment.ORSHIP_WEB_PORT}`,
  })
  await server.register(rateLimit, { max: 240, timeWindow: '1 minute' })
  await server.register(underPressure, { exposeStatusRoute: false })
  server.setErrorHandler(async (error, request, reply) => {
    request.log.error({ err: error }, 'Orship request failed')
    if (error instanceof ZodError) {
      await reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'The request is invalid.' },
      })
      return
    }
    await reply.status(500).send({
      error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed.' },
    })
  })
  await registerOrchestrationModule(server, environment, getProjectRoot())
  const healthSchema = z.toJSONSchema(
    z.object({ service: z.literal('orship-api'), status: z.string() }),
  )
  server.get('/health', { schema: { response: { 200: healthSchema } } }, async () => ({
    service: 'orship-api' as const,
    status: 'ok',
  }))
  server.get('/health/live', { schema: { response: { 200: healthSchema } } }, async () => ({
    service: 'orship-api' as const,
    status: 'ok',
  }))
  server.get('/health/ready', { schema: { response: { 200: healthSchema } } }, async () => ({
    service: 'orship-api' as const,
    status: 'ready',
  }))
  return server
}
