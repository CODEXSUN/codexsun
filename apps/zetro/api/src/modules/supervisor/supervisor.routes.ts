import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { InvalidChatWorkspaceScopeError } from '../chat/index.js'
import { ProjectNotFoundError } from '../projects/index.js'
import { SystemTaskNotFoundError } from '../system-tasks/index.js'
import {
  supervisorJobSchema,
  supervisorProjectSchema,
  supervisorTaskParams,
} from './supervisor.schema.js'
import { SupervisorPolicyError, type SupervisorService } from './supervisor.service.js'

const objectResponse = { type: 'object', additionalProperties: true }
const response = {
  200: objectResponse,
  202: objectResponse,
  400: objectResponse,
  401: objectResponse,
  403: objectResponse,
  404: objectResponse,
  409: objectResponse,
  413: objectResponse,
  500: objectResponse,
  503: objectResponse,
}

export async function registerSupervisorRoutes(
  server: FastifyInstance,
  service: SupervisorService,
) {
  await server.register(
    async (routes) => {
      routes.setErrorHandler((error, _request, reply) => {
        if (error instanceof ZodError)
          return reply.code(400).send({ error: 'Invalid supervisor request.' })
        if (error instanceof InvalidChatWorkspaceScopeError)
          return reply.code(400).send({ error: error.message })
        if (error instanceof ProjectNotFoundError || error instanceof SystemTaskNotFoundError) {
          return reply.code(404).send({ error: error.message })
        }
        if (error instanceof SupervisorPolicyError)
          return reply.code(409).send({ error: error.message })
        routes.log.error({ err: error }, 'Supervisor request failed.')
        return reply
          .code(500)
          .send({ error: 'Supervisor request failed. Inspect the desktop log.' })
      })
      routes.get('/capabilities', { schema: { response } }, async () => ({
        version: '0.1.0',
        workflows: ['review', 'develop', 'document', 'test'],
        execution: 'isolated-worktree',
        approval: 'approved:true required for each submitted job',
        replay: 'disabled',
        transport: 'loopback-bearer-token',
        limitations: [
          'No commit, push, or deployment endpoint.',
          'Folder scope is agent guidance, not an operating-system sandbox.',
          'Connect a project and Codex account before submission.',
        ],
      }))
      routes.get('/projects', { schema: { response } }, async () => ({
        projects: service.listProjects(),
      }))
      routes.post('/projects', { bodyLimit: 4_096, schema: { response } }, async (request) => {
        const { name, repositoryPath } = supervisorProjectSchema.parse(request.body)
        return { project: await service.connectProject({ name, repositoryPath }) }
      })
      routes.get('/jobs', { schema: { response } }, async () => ({ tasks: await service.list() }))
      routes.post('/jobs', { bodyLimit: 32_768, schema: { response } }, async (request, reply) => {
        const task = await service.submit(supervisorJobSchema.parse(request.body))
        return reply.code(202).send({ task })
      })
      routes.get('/jobs/:taskId', { schema: { response } }, async (request) => ({
        task: await service.get(supervisorTaskParams.parse(request.params).taskId),
      }))
      routes.post('/jobs/:taskId/stop', { schema: { response } }, async (request) => ({
        task: await service.stop(supervisorTaskParams.parse(request.params).taskId),
      }))
    },
    { prefix: '/api/v1/supervisor' },
  )
}
