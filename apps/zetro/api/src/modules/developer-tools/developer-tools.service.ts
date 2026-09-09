import type { ProjectService } from '../projects/index.js'
import {
  compareGitBranch,
  readGitDeliverySnapshot,
  readGitStatus,
  runGitAction,
} from './developer-tools.git.js'
import { launchDeveloperTarget, listEditors } from './developer-tools.launcher.js'
import type { DeveloperToolsRepository } from './developer-tools.repository.js'
import type { DeveloperToolSettings, ProjectToolSettings } from './developer-tools.types.js'

export class DeveloperToolsService {
  public constructor(
    private readonly repository: DeveloperToolsRepository,
    private readonly projects: ProjectService,
  ) {}

  public async getGlobalSettings() {
    return { editors: await listEditors(), settings: this.repository.getGlobal() }
  }

  public async setGlobalSettings(settings: DeveloperToolSettings) {
    await this.repository.setGlobal(settings)
    return this.getGlobalSettings()
  }

  public async getProjectSettings(projectId: string) {
    this.projects.get(projectId)
    const project = this.repository.getProject(projectId)
    return { effective: this.effective(project), project }
  }

  public async setProjectSettings(projectId: string, settings: ProjectToolSettings) {
    this.projects.get(projectId)
    await this.repository.setProject(projectId, settings)
    return this.getProjectSettings(projectId)
  }

  public status(projectId: string) {
    return readGitStatus(this.projects.get(projectId).repositoryPath)
  }

  public compare(projectId: string, baseBranch: string) {
    return compareGitBranch(this.projects.get(projectId).repositoryPath, baseBranch)
  }

  public deliverySnapshot(projectId: string) {
    return readGitDeliverySnapshot(this.projects.get(projectId).repositoryPath)
  }

  public async runAction(
    projectId: string,
    action:
      | { action: 'fetch' }
      | { action: 'sync'; strategy: 'merge' | 'rebase' }
      | { action: 'branch'; name: string }
      | { action: 'commit'; message: string; stageAll: boolean }
      | { action: 'push'; forceWithLease: boolean }
      | { action: 'revert'; commit: string },
  ) {
    const project = this.projects.get(projectId)
    const settings = this.effective(this.repository.getProject(projectId))
    if (action.action === 'push' && !settings.allowPush)
      throw new DeveloperToolsPolicyError('Push is disabled for this project.')
    if (action.action === 'push' && action.forceWithLease && !settings.allowForceWithLease) {
      throw new DeveloperToolsPolicyError('Force-with-lease is disabled for this project.')
    }
    const command =
      action.action === 'branch'
        ? { action: 'branch' as const, branch: `${settings.branchPrefix}${action.name}` }
        : action
    const output = await runGitAction(project.repositoryPath, command)
    return { output, status: await readGitStatus(project.repositoryPath) }
  }

  public async launch(projectId: string, target: 'editor' | 'files' | 'terminal') {
    const project = this.projects.get(projectId)
    const settings = this.effective(this.repository.getProject(projectId))
    await launchDeveloperTarget(project.repositoryPath, target, settings.editor)
    return { launched: true, target }
  }

  private effective(project: ProjectToolSettings): DeveloperToolSettings {
    if (project.inheritGlobal) return this.repository.getGlobal()
    const { inheritGlobal: _inheritGlobal, ...settings } = project
    return settings
  }
}

export class DeveloperToolsPolicyError extends Error {}
