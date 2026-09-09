import { deploymentCatalogSchema } from '@codexsun/runtime'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { OrshipEnvironment } from '../../../config.js'
import type {
  OrchestrationTarget,
  OrchestrationTargetCatalog,
} from '../domain/orchestration.ports.js'

export class DeploymentTargetCatalog implements OrchestrationTargetCatalog {
  constructor(
    private readonly projectRoot: string,
    private readonly environment: OrshipEnvironment,
  ) {}

  async list(): Promise<readonly OrchestrationTarget[]> {
    const input: unknown = JSON.parse(
      await readFile(join(this.projectRoot, '.container/catalog.json'), 'utf8'),
    )
    const catalog = deploymentCatalogSchema.parse(input)

    return catalog.applications.flatMap((application) =>
      application.components.map((component) => {
        const protectedService = application.id === 'orship'
        return {
          applicationId: application.id,
          controllable: this.environment.ORSHIP_CONTROL_ENABLED === 'true' && !protectedService,
          healthPath: component.healthPath,
          id: component.id,
          kind: component.kind,
          port: readPort(component.portEnvironmentKey, component.defaultPort),
          protected: protectedService,
        }
      }),
    )
  }
}

function readPort(key: string, defaultPort: number): number {
  const port = Number(process.env[key] ?? defaultPort)
  return Number.isInteger(port) && port >= 6000 && port <= 6999 ? port : defaultPort
}
