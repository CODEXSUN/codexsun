import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { AgentTaskSource } from './application/agent-task.ports.js'
import { AgentTaskService } from './application/agent-task.service.js'
import { AgentTaskRepository } from './infrastructure/agent-task.repository.js'
import { registerAgentTaskRoutes } from './presentation/agent-task.routes.js'

export const agentTaskModuleManifest = {
  capabilities: ['chat-handoff', 'durable-task-drafts', 'task-registry'],
  dependencies: { 'zetro.chat.api': '^2.3.0' },
  id: 'zetro.agent-tasks.api',
  lifecycle: {
    activate: 'Registers task draft list, detail, and chat handoff routes.',
    deactivate: 'Closes Agent Task SQLite storage.',
    install: 'Applies owned Agent Task SQLite migrations.',
    uninstall: 'Preserves task drafts.',
    upgrade: 'Adds migrations without changing applied checksums.',
  },
  publicContracts: [
    'GET /api/zetro/v1/agent-tasks',
    'GET /api/zetro/v1/agent-tasks/:taskId',
    'POST /api/zetro/v1/agent-tasks/from-chat',
  ],
  scope: 'zetro-api',
  version: '1.0.0',
} as const

export async function registerAgentTaskModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  source: AgentTaskSource,
) {
  const repository = new AgentTaskRepository(resolve(projectRoot, environment.ZETRO_DATABASE_PATH))
  const service = new AgentTaskService(repository, source)
  await registerAgentTaskRoutes(server, service)
  return service
}
