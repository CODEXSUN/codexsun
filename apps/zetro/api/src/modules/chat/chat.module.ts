import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { CodexAppServerClient } from '../codex-connection/index.js'
import { ChatConversationRepository } from './chat.conversation.repository.js'
import { ChatConversationService } from './chat.conversation.service.js'
import { CodexAppServerProvider } from './chat.provider.js'
import { registerChatRoutes } from './chat.routes.js'
import { ChatService } from './chat.service.js'

export const chatModuleManifest = {
  capabilities: [
    'conversation-history',
    'conversation-pin',
    'conversation-rename',
    'multimodal-chat',
    'codex-app-server',
    'isolated-worktree-execution',
    'coding-tool-activity',
    'task-workflows',
    'delivery-tool-catalog',
    'delivery-record-persistence',
  ],
  dependencies: { 'zetro.codex-connection.api': '^0.5.0' },
  id: 'zetro.chat.api',
  lifecycle: {
    activate: 'Register the validated HTTP route and provider adapter.',
    deactivate: 'Stop accepting new chat turns with the API runtime.',
    install: 'Create the private Zetro conversation history file on first start.',
    uninstall: 'Keep conversation history unless an explicit data removal flow runs.',
    upgrade: 'Version 0.5.0 stores optional delivery records without a data migration.',
  },
  publicContracts: [
    'POST /api/v1/chat/responses',
    'GET /api/v1/chat/conversations',
    'GET /api/v1/chat/conversations/:conversationId',
    'POST /api/v1/chat/conversations',
    'PATCH /api/v1/chat/conversations/:conversationId',
  ],
  scope: 'zetro-api',
  version: '0.5.0',
} as const

export async function registerChatModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  appServerClient: CodexAppServerClient,
  projectRoot: string,
) {
  const provider = new CodexAppServerProvider(appServerClient)

  const repository = new ChatConversationRepository(
    resolve(projectRoot, environment.STORAGE_ROOT, 'private', 'zetro', 'conversations.json'),
  )
  await repository.initialize()
  await registerChatRoutes(
    server,
    new ChatService(provider),
    new ChatConversationService(repository),
  )
}
