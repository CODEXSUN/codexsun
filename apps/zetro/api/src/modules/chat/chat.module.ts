import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import { ChatService } from './application/chat.service.js'
import { ChatRepository } from './infrastructure/chat.repository.js'
import { CodexChatClient } from './infrastructure/codex-chat.client.js'
import { registerChatRoutes } from './presentation/chat.routes.js'

export const chatModuleManifest = {
  capabilities: [
    'atomic-turn-lifecycle',
    'codex-chat',
    'concurrent-turns',
    'sqlite-chat-history',
    'stream-reconnect',
  ],
  dependencies: {},
  id: 'zetro.chat.api',
  lifecycle: {
    activate: 'Registers durable turn, event stream, stop, and history routes.',
    deactivate: 'Stops Codex and closes SQLite.',
    install: 'Applies the SQLite chat schema migrations.',
    uninstall: 'Preserves chat history.',
    upgrade: 'Migrates session identity to durable conversation identity.',
  },
  publicContracts: [
    'POST /api/zetro/v1/chat/turns',
    'GET /api/zetro/v1/chat/turns/:turnId/events',
    'POST /api/zetro/v1/chat/stop',
    'GET /api/zetro/v1/chat/history',
  ],
  scope: 'zetro-api',
  version: '2.0.0',
} as const

export async function registerChatModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
) {
  const repository = new ChatRepository(resolve(projectRoot, environment.ZETRO_DATABASE_PATH))
  const service = new ChatService(repository, new CodexChatClient())
  await registerChatRoutes(server, service)
  server.addHook('onClose', () => service.close())
  return service
}
