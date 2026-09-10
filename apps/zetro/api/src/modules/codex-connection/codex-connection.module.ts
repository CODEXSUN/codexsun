import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import { CodexAppServerClient } from './codex-app-server.client.js'
import { CodexWorktreeService } from './codex-worktree.service.js'
import { registerCodexConnectionRoutes } from './codex-connection.routes.js'
import { CodexConnectionService } from './codex-connection.service.js'

export const codexConnectionModuleManifest = {
  capabilities: [
    'codex-account-status',
    'codex-device-login',
    'codex-logout',
    'codex-turns',
    'codex-turn-model-selection',
    'codex-turn-interrupt',
    'ephemeral-codex-threads',
    'isolated-git-worktrees',
    'scoped-working-directory',
    'coding-tools',
    'task-workflows',
    'governed-delivery-pipeline',
    'structured-delivery-records',
    'worktree-lifecycle',
  ],
  dependencies: {},
  id: 'zetro.codex-connection.api',
  lifecycle: {
    activate: 'Register routes and lazily start the local Codex App Server.',
    deactivate: 'Close the local Codex App Server process.',
    install: 'No Zetro credentials or persistent records are created.',
    uninstall: 'Leave Codex-managed credentials untouched.',
    upgrade: 'Version 0.7.0 adds validated model and reasoning selection for each turn.',
  },
  publicContracts: [
    'GET /api/v1/settings/codex',
    'POST /api/v1/settings/codex/device-code',
    'POST /api/v1/settings/codex/activate',
    'POST /api/v1/settings/codex/disconnect',
    'CodexAppServerClient',
  ],
  scope: 'zetro-api',
  version: '0.9.0',
} as const

export async function registerCodexConnectionModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
) {
  const worktrees = new CodexWorktreeService(
    projectRoot,
    resolve(projectRoot, environment.ZETRO_WORKTREE_ROOT),
  )
  const client = new CodexAppServerClient(
    environment.ZETRO_CODEX_COMMAND,
    projectRoot,
    worktrees,
    environment.ZETRO_CODEX_API_KEY,
    environment.ZETRO_CODEX_BASE_URL,
    environment.ZETRO_CODEX_MODEL,
  )
  const service = new CodexConnectionService(client, environment)
  await registerCodexConnectionRoutes(server, service)
  server.addHook('onClose', () => client.close())
  return { client, service, worktrees }
}
