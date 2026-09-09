import { request } from 'node:http'
import type {
  DockerContainer,
  DockerContainerAction,
  DockerContainerActionResponse,
  DockerContainerList,
} from '@codexsun/orship-contracts'
import { DockerControlStore } from './docker-control.store.js'

type DockerSummary = {
  Created: number
  Id: string
  Image: string
  Labels: Record<string, string> | null
  Names: string[]
  Ports: Array<{ PrivatePort?: number; PublicPort?: number; Type?: string }>
  State: string
  Status: string
}

export class DockerControlGateway {
  constructor(
    private readonly socketPath: string,
    private readonly managedLabel: string,
    private readonly enabled: boolean,
    private readonly store: DockerControlStore,
  ) {}

  async list(): Promise<DockerContainerList> {
    if (!this.enabled) return unavailable('Docker control is disabled.')
    try {
      const containers = (await this.call<DockerSummary[]>('/containers/json?all=true'))
        .filter((container) => this.isManaged(container.Labels ?? {}))
        .map((container) => toContainer(container))
      return { available: true, containers, reason: null, updatedAt: new Date().toISOString() }
    } catch {
      return unavailable('Docker is unavailable at the configured local socket.')
    }
  }

  async act(
    containerId: string,
    action: DockerContainerAction,
  ): Promise<DockerContainerActionResponse> {
    if (!this.enabled) throw new Error('Docker control is disabled.')
    const container = await this.findManagedContainer(containerId)
    await this.call<void>(`/containers/${encodeURIComponent(container.id)}/${action}`, 'POST')
    const updated = await this.findManagedContainer(container.id)
    const message = `${updated.name} ${action} request completed.`
    await this.store.record(updated.id, action, message)
    return { container: updated, message }
  }

  close(): void {
    this.store.close()
  }

  private async findManagedContainer(containerId: string): Promise<DockerContainer> {
    const containers = await this.list()
    const container = containers.containers.find(({ id }) => id.startsWith(containerId))
    if (!container) throw new Error('This Docker container is not available for Orship control.')
    return container
  }

  private isManaged(labels: Record<string, string>): boolean {
    const [key, value] = this.managedLabel.split('=', 2)
    return Boolean(key && value && labels[key] === value)
  }

  private async call<T>(path: string, method = 'GET'): Promise<T> {
    return new Promise<T>((resolveCall, reject) => {
      const operation = request(
        { method, path, socketPath: this.socketPath, timeout: 3_000 },
        (response) => {
          const chunks: Buffer[] = []
          response.on('data', (chunk: Buffer) => chunks.push(chunk))
          response.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8')
            if (!response.statusCode || response.statusCode >= 300) {
              reject(new Error(`Docker returned ${response.statusCode ?? 0}.`))
              return
            }
            if (!body) return resolveCall(undefined as T)
            try {
              resolveCall(JSON.parse(body) as T)
            } catch {
              reject(new Error('Docker returned an invalid response.'))
            }
          })
        },
      )
      operation.on('error', reject)
      operation.on('timeout', () => operation.destroy(new Error('Docker did not respond in time.')))
      operation.end()
    })
  }
}

function unavailable(reason: string): DockerContainerList {
  return { available: false, containers: [], reason, updatedAt: new Date().toISOString() }
}

function toContainer(container: DockerSummary): DockerContainer {
  return {
    createdAt: new Date(container.Created * 1_000).toISOString(),
    id: container.Id,
    image: container.Image,
    name: container.Names[0]?.replace(/^\//u, '') ?? container.Id.slice(0, 12),
    ports: container.Ports.map((port) =>
      [port.PublicPort, port.PrivatePort, port.Type].filter(Boolean).join(':'),
    ),
    state: normalizeState(container.State),
    status: container.Status,
  }
}

function normalizeState(state: string): DockerContainer['state'] {
  return ['created', 'running', 'paused', 'restarting', 'exited'].includes(state)
    ? (state as DockerContainer['state'])
    : 'exited'
}
