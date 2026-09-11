import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import { ChatService } from './application/chat.service.js'
import { ChatRepository } from './infrastructure/chat.repository.js'
import type { ProviderRunner } from '../providers/index.js'
import { registerChatRoutes } from './presentation/chat.routes.js'

export const chatModuleManifest = {
  capabilities: [
    'atomic-turn-lifecycle',
    'codex-chat',
    'concurrent-turns',
    'conversation-registry',
    'task-source-query',
    'turn-provider-snapshot',
    'sqlite-chat-history',
    'stream-reconnect',
  ],
  dependencies: { 'zetro.providers.api': '^1.0.0' },
  id: 'zetro.chat.api',
  lifecycle: {
    activate: 'Registers conversation registry, durable turn, stream, stop, and history routes.',
    deactivate: 'Stops Codex and closes SQLite.',
    install: 'Applies the SQLite chat schema migrations.',
    uninstall: 'Preserves chat history.',
    upgrade: 'Adds immutable provider metadata to each accepted turn.',
  },
  publicContracts: [
    'GET /api/zetro/v1/chat/conversations',
    'POST /api/zetro/v1/chat/conversations',
    'PATCH /api/zetro/v1/chat/conversations/:conversationId',
    'POST /api/zetro/v1/chat/turns',
    'GET /api/zetro/v1/chat/turns/:turnId/events',
    'POST /api/zetro/v1/chat/stop',
    'GET /api/zetro/v1/chat/history',
  ],
  scope: 'zetro-api',
  version: '2.3.0',
} as const

export async function registerChatModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  runner: ProviderRunner,
) {
  const repository = new ChatRepository(resolve(projectRoot, environment.ZETRO_DATABASE_PATH))
  const service = new ChatService(repository, runner)
  await registerChatRoutes(server, service)
  return service
}
