import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import type { PrerequisiteOverview, PrerequisiteBuildRequest, PrerequisiteBuildResponse } from '@codexsun/orship-contracts'
import { DockerControlGateway } from '../infrastructure/docker-control.gateway.js'

const services = [
  { id: 'mariadb', name: 'MariaDB' },
  { id: 'redis', name: 'Redis' },
  { id: 'filebrowser', name: 'File Browser' },
] as const

export class PrerequisiteService {
  constructor(private readonly docker: DockerControlGateway, private readonly projectRoot: string) {}

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

  async build(input: PrerequisiteBuildRequest): Promise<PrerequisiteBuildResponse> {
    const scriptPath = `${this.projectRoot}/.container/prerequisites/setup-prerequisites.sh`
    const scriptExists = await readFile(scriptPath, 'utf8').then(() => true).catch(() => false)
    if (!scriptExists) {
      return { success: false, message: 'Setup script not found', exitCode: -1 }
    }

    return new Promise((resolve) => {
      const args = input.forceRebuild ? ['--build'] : []
      const child = spawn('bash', [scriptPath, ...args], {
        cwd: this.projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => { stdout += data.toString() })
      child.stderr.on('data', (data) => { stderr += data.toString() })

      child.on('close', (code) => {
        const output = stdout + stderr
        if (code === 0) {
          resolve({ success: true, message: 'Prerequisites built and started successfully', output, exitCode: code })
        } else {
          resolve({ success: false, message: `Build failed with exit code ${code}`, output, exitCode: code })
        }
      })

      child.on('error', (error) => {
        resolve({ success: false, message: `Failed to start build: ${error.message}`, exitCode: -1 })
      })
    })
  }
}

function healthState(status: string | undefined): 'healthy' | 'starting' | 'unavailable' {
  if (status === 'healthy') return 'healthy'
  if (status === 'running' || status === 'starting') return 'starting'
  return 'unavailable'
}
