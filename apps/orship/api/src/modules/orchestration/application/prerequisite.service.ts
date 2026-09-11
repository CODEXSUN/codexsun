import type { PrerequisiteOverview } from '@codexsun/orship-contracts'
import { DockerControlGateway } from '../infrastructure/docker-control.gateway.js'

const services = [
  { id: 'mariadb', name: 'MariaDB' },
  { id: 'redis', name: 'Redis' },
  { id: 'filebrowser', name: 'File Browser' },
] as const

export class PrerequisiteService {
  constructor(private readonly docker: DockerControlGateway) {}

  async getOverview(): Promise<PrerequisiteOverview> {
    try {
      const containers = await this.docker.healthByLabel('codexsun.orship.prerequisite=true')
      return {
        available: true,
        services: services.map((service) => {
          const container = containers.find(
            (candidate) => candidate.name === `orship-${service.id}`,
          )
          return {
            ...service,
            state: healthState(container?.status),
            status: container?.status ?? 'Not installed',
          }
        }),
        updatedAt: new Date().toISOString(),
      }
    } catch {
      return {
        available: false,
        services: services.map((service) => ({
          ...service,
          state: 'unavailable',
          status: 'Docker unavailable',
        })),
        updatedAt: new Date().toISOString(),
      }
    }
  }
}

function healthState(status: string | undefined): 'healthy' | 'starting' | 'unavailable' {
  if (status === 'healthy') return 'healthy'
  if (status === 'running' || status === 'starting') return 'starting'
  return 'unavailable'
}
