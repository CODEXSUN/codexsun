import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { CodexAppServerClient } from '../codex-connection/index.js'
import { defaultProjectId, type ProjectService } from '../projects/index.js'
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
    'conversation-archive',
    'conversation-permanent-delete',
    'conversation-workspace-scope',
    'conversation-turn-stop',
    'multimodal-chat',
    'codex-app-server',
    'isolated-worktree-execution',
    'coding-tool-activity',
    'task-workflows',
    'delivery-tool-catalog',
    'delivery-record-persistence',
  ],
  dataSchema: { checksum: 'chat-001-conversations-v1', version: 1 },
  dependencies: { 'zetro.codex-connection.api': '^0.6.0', 'zetro.projects.api': '^0.5.0' },
  id: 'zetro.chat.api',
  lifecycle: {
    activate: 'Register the validated HTTP route and provider adapter.',
    deactivate: 'Stop accepting new chat turns with the API runtime.',
    install: 'Create the module-owned conversation table and import legacy history once.',
    uninstall: 'Keep conversation history unless an explicit data removal flow runs.',
    upgrade: 'Version 0.11.0 migrates conversation history to SQLite or MariaDB.',
  },
  publicContracts: [
    'POST /api/v1/chat/responses',
    'POST /api/v1/chat/responses/:conversationId/stop',
    'GET /api/v1/chat/conversations',
    'GET /api/v1/chat/conversations/:conversationId',
    'POST /api/v1/chat/conversations',
    'PATCH /api/v1/chat/conversations/:conversationId',
    'DELETE /api/v1/chat/conversations/:conversationId',
    'DELETE /api/v1/chat/conversations/archived',
  ],
  scope: 'zetro-api',
  version: '0.11.0',
} as const

export async function registerChatModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  appServerClient: CodexAppServerClient,
  projectRoot: string,
  projects: ProjectService,
  database: ZetroDatabase,
) {
  const provider = new CodexAppServerProvider(appServerClient)

  const repository = new ChatConversationRepository(
    database,
    resolve(projectRoot, environment.STORAGE_ROOT, 'private', 'zetro', 'conversations.json'),
    defaultProjectId,
  )
  await repository.initialize()
  await registerChatRoutes(
    server,
    new ChatService(provider),
    new ChatConversationService(repository),
    projects,
  )
}
