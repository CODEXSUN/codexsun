import type { ProjectService } from '../projects/index.js'
import type { SystemTaskService } from '../system-tasks/index.js'
import {
  compareGitBranch,
  readGitDeliverySnapshot,
  readGitStatus,
  runGitAction,
} from './developer-tools.git.js'
import { launchDeveloperTarget, listEditors } from './developer-tools.launcher.js'
import {
  changeStash,
  createPullRequest,
  deleteMergedBranch,
  listBranches,
  listChangedFiles,
  listConflicts,
  listStashes,
  readFileBlame,
  readFileDiff,
  readFileHistory,
  resolveConflict,
  stageChange,
} from './developer-tools.repository-git.js'
import { listRepositoryScripts, runRepositoryScript } from './developer-tools.tasks.js'
import type { DeveloperToolsRepository } from './developer-tools.repository.js'
import type { DeveloperToolSettings, ProjectToolSettings } from './developer-tools.types.js'

export class DeveloperToolsService {
  public constructor(
    private readonly repository: DeveloperToolsRepository,
    private readonly projects: ProjectService,
    private readonly systemTasks: SystemTaskService,
  ) {
    systemTasks.register('developer-tools.repository-script', async (input, context) => {
      const task = readScriptTask(input)
      const project = this.projects.get(task.projectId)
      const settings = this.effective(this.repository.getProject(task.projectId))
      if (!settings.trustedRepository) {
        throw new DeveloperToolsPolicyError('Trust this repository before running its scripts.')
      }
      await context.step('info', `Started npm run ${task.script}.`)
      const result = await runRepositoryScript(project.repositoryPath, task.script, context.signal)
      await context.step('completed', `${task.script} completed with exit code 0.`)
      return result
    })
  }

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

  public scripts(projectId: string) {
    return listRepositoryScripts(this.projects.get(projectId).repositoryPath)
  }

  public changes(projectId: string) {
    return listChangedFiles(this.path(projectId))
  }

  public diff(projectId: string, filePath: string, staged: boolean) {
    return readFileDiff(this.path(projectId), filePath, staged)
  }

  public async stage(projectId: string, filePath: string, staged: boolean, hunk?: number) {
    await stageChange(this.path(projectId), filePath, staged, hunk)
    return this.status(projectId)
  }

  public history(projectId: string, filePath: string) {
    return readFileHistory(this.path(projectId), filePath)
  }

  public blame(projectId: string, filePath: string) {
    return readFileBlame(this.path(projectId), filePath)
  }

  public conflicts(projectId: string) {
    return listConflicts(this.path(projectId))
  }

  public async resolveConflict(
    projectId: string,
    filePath: string,
    resolution: 'ours' | 'theirs' | 'manual',
    content?: string,
  ) {
    await resolveConflict(this.path(projectId), filePath, resolution, content)
    return this.status(projectId)
  }

  public branches(projectId: string) {
    return listBranches(this.path(projectId))
  }

  public async deleteBranch(projectId: string, branch: string) {
    const settings = this.effective(this.repository.getProject(projectId))
    if (settings.protectedBranches.includes(branch)) {
      throw new DeveloperToolsPolicyError(`${branch} is a protected branch.`)
    }
    await deleteMergedBranch(this.path(projectId), branch)
    return this.branches(projectId)
  }

  public stashes(projectId: string) {
    return listStashes(this.path(projectId))
  }

  public async stash(
    projectId: string,
    action: 'create' | 'apply' | 'drop',
    index?: number,
    message?: string,
  ) {
    await changeStash(this.path(projectId), action, index, message)
    return this.stashes(projectId)
  }

  public async pullRequest(
    projectId: string,
    input: { base: string; body: string; draft: boolean; title: string },
  ) {
    const settings = this.effective(this.repository.getProject(projectId))
    if (!settings.allowPullRequests) {
      throw new DeveloperToolsPolicyError('Pull-request creation is disabled for this project.')
    }
    return { url: await createPullRequest(this.path(projectId), input) }
  }

  public runScript(projectId: string, script: string) {
    this.projects.get(projectId)
    const settings = this.effective(this.repository.getProject(projectId))
    if (!settings.trustedRepository) {
      throw new DeveloperToolsPolicyError('Trust this repository before running its scripts.')
    }
    return this.systemTasks.enqueue({
      input: { projectId, script },
      maxAttempts: 1,
      projectId,
      title: `npm run ${script}`,
      type: 'developer-tools.repository-script',
    })
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
    if (action.action === 'push') {
      const status = await readGitStatus(project.repositoryPath)
      if (settings.protectedBranches.includes(status.branch)) {
        throw new DeveloperToolsPolicyError(`Direct push to ${status.branch} is protected.`)
      }
    }
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

  private path(projectId: string) {
    return this.projects.get(projectId).repositoryPath
  }
}

export class DeveloperToolsPolicyError extends Error {}

function readScriptTask(value: unknown): { projectId: string; script: string } {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('projectId' in value) ||
    typeof value.projectId !== 'string' ||
    !('script' in value) ||
    typeof value.script !== 'string'
  ) {
    throw new DeveloperToolsPolicyError('The repository script task is invalid.')
  }
  return { projectId: value.projectId, script: value.script }
}
