import type { FastifyInstance } from 'fastify'
import type { ChatConversationService, ChatService } from '../chat/index.js'
import type { ProjectService } from '../projects/index.js'
import type { SystemTaskService } from '../system-tasks/index.js'
import { registerSupervisorRoutes } from './supervisor.routes.js'
import { SupervisorService } from './supervisor.service.js'

export const supervisorModuleManifest = {
  id: 'zetro.supervisor.api',
  version: '0.3.1',
  scope: 'zetro-api',
  capabilities: ['external-agent-jobs', 'durable-results', 'agent-cancellation'],
  dependencies: {
    'zetro.chat.api': '^0.16.2',
    'zetro.projects.api': '^0.5.0',
    'zetro.system-tasks.api': '^1.1.0',
  },
  publicContracts: ['SupervisorService', '/api/v1/supervisor/*'],
  lifecycle: {
    install: 'Use public Chat and System Tasks persistence. No owned tables.',
    activate: 'Register authenticated local routes and a single-attempt job handler.',
    deactivate: 'Cancel active turns through the System Tasks close hook.',
    upgrade: 'Preserve existing conversations and job history.',
    uninstall: 'Preserve history and worktrees.',
  },
} as const

export async function registerSupervisorModule(
  server: FastifyInstance,
  projects: ProjectService,
  chat: { service: ChatService; conversations: ChatConversationService },
  tasks: SystemTaskService,
) {
  const service = new SupervisorService(projects, chat.service, chat.conversations, tasks)
  await registerSupervisorRoutes(server, service)
  return service
}
