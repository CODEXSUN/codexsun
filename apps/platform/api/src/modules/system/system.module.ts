import type { FrameworkModule } from '@codexsun/framework'
import type { PlatformApiModule } from '@codexsun/platform-core-api'
import { successEnvelopeSchema, systemRuntimeDataSchema } from '@codexsun/platform-contracts'
import { z } from 'zod'
import { createResponseMeta } from '../../http.js'

export const systemManifest: FrameworkModule = {
  capabilities: ['system.diagnostics.read', 'system.runtime.read'],
  configuration: [],
  consumes: [],
  dependencies: [{ id: 'module-runtime', versionRange: '^1.0.0' }],
  description: 'Reports the Platform runtime and composed module versions.',
  extensionPoints: [],
  extensions: [],
  id: 'system',
  kind: 'core',
  lifecycle: {
    activate() {},
    deactivate() {},
    install() {},
    uninstall() {},
    upgrade() {},
  },
  owner: 'platform',
  platformVersionRange: '^0.1.0',
  publicContracts: [{ id: 'system.runtime', version: '1.1.0' }],
  publishes: [],
  scope: 'platform',
  version: '1.1.0',
}

export const systemApiModule: PlatformApiModule = {
  createPlugin: (context) => async (server) => {
    server.get(
      '/api/system/runtime',
      {
        schema: {
          response: { 200: z.toJSONSchema(successEnvelopeSchema(systemRuntimeDataSchema)) },
        },
      },
      async (request) => ({
        success: true,
        data: {
          diagnostics: context.diagnostics.list(),
          modules: context.modules,
          platformVersion: '0.1.0',
        },
        meta: createResponseMeta(request),
      }),
    )
  },
  manifest: systemManifest,
}
