import type { FrameworkModule } from '@codexsun/framework'
import type { FastifyInstance } from 'fastify'
import type { OrshipEnvironment } from '../../config.js'
import { CloudTargetService } from './application/cloud-target.service.js'
import { DeploymentEvidenceService } from './application/deployment-evidence.service.js'
import { OrchestrationService } from './application/orchestration.service.js'
import { DeploymentTargetCatalog } from './infrastructure/deployment-target.catalog.js'
import { CloudTargetStore } from './infrastructure/cloud-target.store.js'
import { DeploymentRecordStore } from './infrastructure/deployment-record.store.js'
import { LocalProcessGateway } from './infrastructure/local-process.gateway.js'
import { LocalDeploymentInspector } from './infrastructure/local-deployment.inspector.js'
import { registerOrchestrationRoutes } from './presentation/orchestration.routes.js'

export const orchestrationManifest: FrameworkModule = {
  capabilities: [
    'orchestration.failures.read',
    'orchestration.deployments.read',
    'orchestration.deployments.record',
    'orchestration.services.read',
    'orchestration.services.control',
  ],
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
  publicContracts: [
    { id: 'orship.services', version: '1.1.0' },
    { id: 'orship.deployments', version: '1.0.0' },
  ],
  publishes: [],
  scope: 'app',
  version: '1.2.0',
}

export async function registerOrchestrationModule(
  server: FastifyInstance,
  environment: OrshipEnvironment,
  projectRoot: string,
): Promise<void> {
  const targetCatalog = new DeploymentTargetCatalog(projectRoot, environment)
  const service = new OrchestrationService(targetCatalog, new LocalProcessGateway(projectRoot))
  const deploymentEvidence = new DeploymentEvidenceService(
    targetCatalog,
    new LocalDeploymentInspector(projectRoot),
    new DeploymentRecordStore(projectRoot),
  )
  const cloudTarget = new CloudTargetService(
    new CloudTargetStore(projectRoot),
    Boolean(environment.ORSHIP_CLOUD_SSH_KEY_PATH),
  )
  await registerOrchestrationRoutes(server, service, cloudTarget, deploymentEvidence)
}
