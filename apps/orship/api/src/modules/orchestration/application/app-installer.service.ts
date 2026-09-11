import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, resolve, relative } from 'node:path'
import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  AppInstallationRequest,
  AppInstallationResult,
  AvailableApplication,
  AvailableApplications,
} from '@codexsun/orship-contracts'
import { DeploymentPlanner } from '@codexsun/runtime'
import type { DeploymentProfile } from '@codexsun/runtime'

const execFileAsync = promisify(execFile)

export class AppInstallerService {
  constructor(
    private readonly projectRoot: string,
    private readonly catalogPath: string,
    private readonly profilesDir: string,
    private readonly deploymentsDir: string,
  ) {}

  async getAvailableApplications(): Promise<AvailableApplications> {
    const catalogContent = await readFile(this.catalogPath, 'utf8')
    const catalog = JSON.parse(catalogContent)

    const applications: AvailableApplication[] = catalog.applications.map((app: any) => ({
      id: app.id,
      version: app.version,
      requires: app.requires,
      components: app.components.map((comp: any) => ({
        id: comp.id,
        name: comp.id,
        kind: comp.kind,
        runtime: comp.runtime,
        defaultPort: comp.defaultPort,
        dependsOn: comp.dependsOn,
      })),
      availableAddons: (catalog.addons || [])
        .filter((addon: any) => addon.targetApplication === app.id)
        .map((addon: any) => ({
          id: addon.id,
          version: addon.version,
          targetApplication: addon.targetApplication,
          componentIds: addon.componentIds,
          requires: addon.requires,
        })),
    }))

    return { applications }
  }

  async install(request: AppInstallationRequest): Promise<AppInstallationResult> {
    const catalogContent = await readFile(this.catalogPath, 'utf8')
    const catalog = JSON.parse(catalogContent)

    const profileId = `client-${request.customerId}-${request.applicationId}`
    const profilePath = join(this.profilesDir, `${profileId}.json`)
    const deployDir = join(this.deploymentsDir, profileId)

    const selectedApps = [request.applicationId]
    const allRequiredApps = new Set<string>()
    const visit = (appId: string) => {
      if (allRequiredApps.has(appId)) return
      const app = catalog.applications.find((a: any) => a.id === appId)
      if (!app) throw new Error(`Application "${appId}" not found in catalog`)
      for (const req of app.requires) visit(req)
      allRequiredApps.add(appId)
    }
    for (const appId of selectedApps) visit(appId)

    const profile: DeploymentProfile = {
      schemaVersion: 1,
      id: profileId,
      version: '1.0.0',
      customer: request.customerId,
      environment: request.environment,
      applications: [...allRequiredApps],
      addons: request.selectedAddons,
      buildEnvironment: {},
      portOverrides: request.portOverrides,
    }

    await mkdir(this.profilesDir, { recursive: true })
    await writeFile(profilePath, JSON.stringify(profile, null, 2), 'utf8')

    const planner = new DeploymentPlanner(catalog)
    const plan = planner.createPlan(profile)

    const { renderDockerCompose } = await import('@codexsun/runtime')
    const composeContent = renderDockerCompose(plan)

    await mkdir(deployDir, { recursive: true })
    const composePath = join(deployDir, 'compose.yaml')
    await writeFile(composePath, composeContent, 'utf8')

    const envPath = join(deployDir, 'environment.env')
    await this.generateEnvironmentFile(envPath, plan, profile)

    return {
      success: true,
      message: `Application ${request.applicationId} prepared for customer ${request.customerId}`,
      profileId,
      composePath: relative(this.projectRoot, composePath),
      exitCode: 0,
    }
  }

  async deploy(profileId: string): Promise<AppInstallationResult> {
    const deployDir = join(this.deploymentsDir, profileId)
    const composePath = join(deployDir, 'compose.yaml')
    const envPath = join(deployDir, 'environment.env')

    try {
      await stat(composePath)
      await stat(envPath)
    } catch {
      return {
        success: false,
        message: `Deployment not found for profile ${profileId}. Run install first.`,
        exitCode: -1,
      }
    }

    return new Promise((resolve) => {
      const child = execFile(
        'docker',
        ['compose', '--env-file', envPath, '-f', composePath, 'up', '-d', '--build'],
        { cwd: this.projectRoot, maxBuffer: 1024 * 1024, timeout: 300_000, windowsHide: true },
      )

      let stdout = ''
      let stderr = ''

      child.stdout?.on('data', (data) => { stdout += data.toString() })
      child.stderr?.on('data', (data) => { stderr += data.toString() })

      child.on('close', (code) => {
        const output = stdout + stderr
        if (code === 0) {
          resolve({ success: true, message: 'Deployment started successfully', output, exitCode: code })
        } else {
          resolve({ success: false, message: `Deployment failed with exit code ${code}`, output, exitCode: code })
        }
      })

      child.on('error', (error) => {
        resolve({ success: false, message: `Failed to start deployment: ${error.message}`, exitCode: -1 })
      })
    })
  }

  private async generateEnvironmentFile(
    envPath: string,
    plan: any,
    profile: DeploymentProfile,
  ): Promise<void> {
    const lines = [
      `# Generated for profile ${profile.id}`,
      `# Customer: ${profile.customer}`,
      `# Environment: ${profile.environment}`,
      ``,
    ]

    for (const component of plan.components) {
      lines.push(`${component.portEnvironmentKey}=${component.port}`)
      if (component.hostEnvironmentKey) {
        lines.push(`${component.hostEnvironmentKey}=0.0.0.0`)
      }
      for (const [key, value] of Object.entries(component.environment)) {
        lines.push(`${key}=${value}`)
      }
      if (component.runtime === 'static') {
        lines.push(`PORT=${component.port}`)
        lines.push(`API_UPSTREAM=${component.apiUpstream ?? '127.0.0.1:9'}`)
      }
      if (component.runtime === 'node') {
        lines.push(`APP_ENV=${profile.environment}`)
        if (profile.environment === 'production') lines.push('LOG_PRETTY="false"')
      }
    }

    await writeFile(envPath, lines.join('\n'), 'utf8')
  }
}