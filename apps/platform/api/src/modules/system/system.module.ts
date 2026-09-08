import type { FrameworkModule } from '@codexsun/framework'
import type { PlatformApiModule } from '@codexsun/platform-core-api'
import { createResponseMeta } from '../../http.js'

export const systemManifest: FrameworkModule = {
  capabilities: ['system.runtime.read'],
  configuration: [],
  consumes: [],
  dependencies: [],
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
  publicContracts: [{ id: 'system.runtime', version: '1.0.0' }],
  publishes: [],
  scope: 'platform',
  version: '1.0.0',
}

export const systemApiModule: PlatformApiModule = {
  createPlugin: (context) => async (server) => {
    server.get('/api/system/runtime', async (request) => ({
      success: true,
      data: {
        modules: context.modules,
        platformVersion: '0.1.0',
      },
      meta: createResponseMeta(request),
    }))
  },
  manifest: systemManifest,
}
