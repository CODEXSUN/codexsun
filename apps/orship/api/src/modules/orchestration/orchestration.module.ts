import type { FrameworkModule } from '@codexsun/framework'
import type { FastifyInstance } from 'fastify'
import type { OrshipEnvironment } from '../../config.js'
import { OrchestrationService } from './application/orchestration.service.js'
import { DeploymentTargetCatalog } from './infrastructure/deployment-target.catalog.js'
import { LocalProcessGateway } from './infrastructure/local-process.gateway.js'
import { registerOrchestrationRoutes } from './presentation/orchestration.routes.js'

export const orchestrationManifest: FrameworkModule = {
  capabilities: ['orchestration.services.read', 'orchestration.services.control'],
  configuration: [{ key: 'ORSHIP_CONTROL_ENABLED', required: true }],
  consumes: [],
  dependencies: [],
  description: 'Observes and controls local CODEXSUN application components.',
  extensionPoints: [],
  extensions: [],
  id: 'orchestration',
  kind: 'feature',
  lifecycle: {
    activate() {},
    deactivate() {},
    install() {},
    uninstall() {},
    upgrade() {},
  },
  owner: 'orship',
  platformVersionRange: '^0.1.0',
  publicContracts: [{ id: 'orship.services', version: '1.0.0' }],
  publishes: [],
  scope: 'app',
  version: '1.0.0',
}

export async function registerOrchestrationModule(
  server: FastifyInstance,
  environment: OrshipEnvironment,
  projectRoot: string,
): Promise<void> {
  const service = new OrchestrationService(
    new DeploymentTargetCatalog(projectRoot, environment),
    new LocalProcessGateway(projectRoot),
  )
  await registerOrchestrationRoutes(server, service)
}
