import type {
  OrchestrationOverview,
  ServiceAction,
  ServiceActionResponse,
  ServiceLogsResponse,
} from '@codexsun/orship-contracts'
import type {
  OrchestrationProcessGateway,
  OrchestrationTarget,
  OrchestrationTargetCatalog,
} from '../domain/orchestration.ports.js'

export class OrchestrationService {
  constructor(
    private readonly catalog: OrchestrationTargetCatalog,
    private readonly processes: OrchestrationProcessGateway,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async getOverview(): Promise<OrchestrationOverview> {
    const services = await this.processes.inspect(await this.catalog.list())
    return {
      checkedAt: this.clock().toISOString(),
      services,
      summary: {
        degraded: services.filter(({ state }) => state === 'degraded').length,
        offline: services.filter(({ state }) => state === 'offline').length,
        online: services.filter(({ state }) => state === 'online').length,
        total: services.length,
      },
    }
  }

  async runAction(serviceId: string, action: ServiceAction): Promise<ServiceActionResponse> {
    const target = await this.getTarget(serviceId)
    if (!target.controllable || target.protected) {
      throw new OrchestrationError('CONTROL_NOT_ALLOWED', 'This service cannot be controlled.', 403)
    }

    await this.processes.act(target, action)
    const [service] = await this.processes.inspect([target])
    if (!service)
      throw new OrchestrationError('SERVICE_NOT_FOUND', 'The service does not exist.', 404)
    return { message: `${serviceId} ${action} completed.`, service }
  }

  async getLogs(serviceId: string, limit: number): Promise<ServiceLogsResponse> {
    return this.processes.readLogs(await this.getTarget(serviceId), limit)
  }

  private async getTarget(serviceId: string): Promise<OrchestrationTarget> {
    const target = (await this.catalog.list()).find(({ id }) => id === serviceId)
    if (!target)
      throw new OrchestrationError('SERVICE_NOT_FOUND', 'The service does not exist.', 404)
    return target
  }
}

export class OrchestrationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
  }
}
