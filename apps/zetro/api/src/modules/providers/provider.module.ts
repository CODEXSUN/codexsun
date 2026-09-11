import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { CodexProviderControl } from './application/provider.ports.js'
import { ProviderService } from './application/provider.service.js'
import { ProviderRepository } from './infrastructure/provider.repository.js'
import { registerProviderRoutes } from './presentation/provider.routes.js'

export const providerModuleManifest = {
  capabilities: ['codex-device-login', 'cxz-runtime', 'dynamic-model-catalog', 'provider-settings'],
  dependencies: {},
  id: 'zetro.providers.api',
  lifecycle: {
    activate: 'Registers confirmed provider selection, account, model, and connection test routes.',
    deactivate: 'Closes provider settings storage.',
    install: 'Creates the provider connection registry in SQLite.',
    uninstall: 'Preserves provider settings and Codex-owned credentials.',
    upgrade: 'Version 1.2.0 confirms a runtime handshake before persisting selection.',
  },
  publicContracts: [
    'GET /api/zetro/v1/providers',
    'PATCH /api/zetro/v1/providers/default',
    'GET /api/zetro/v1/providers/:connectionId/models',
    'GET /api/zetro/v1/providers/codex/account',
    'POST /api/zetro/v1/providers/codex/device-login',
    'GET /api/zetro/v1/providers/:connectionId/account',
    'POST /api/zetro/v1/providers/:connectionId/device-login',
    'POST /api/zetro/v1/providers/:connectionId/test',
  ],
  scope: 'zetro-api',
  version: '1.2.0',
} as const

export async function registerProviderModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  codex: CodexProviderControl,
) {
  const repository = new ProviderRepository(
    resolve(projectRoot, environment.ZETRO_DATABASE_PATH),
    environment.ZETRO_CXZ_URL,
  )
  const service = new ProviderService(repository, codex)
  await registerProviderRoutes(server, service)
  return service
}
