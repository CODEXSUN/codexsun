import { randomUUID } from 'node:crypto'
import type { DeveloperToolsService } from '../developer-tools/index.js'
import type { ProjectService } from '../projects/index.js'
import type { SystemTaskContext, SystemTaskService } from '../system-tasks/index.js'
import type { GitDeliveryRepository } from './git-delivery.repository.js'
import {
  appendRepositoryChangelog,
  bumpRepositoryVersion,
  readReleaseProfile,
} from './git-delivery.runner.js'
import type {
  GitDeliveryFlowInput,
  GitDeliveryFlowRecord,
  GitDeliverySettings,
  GitDeliveryStepResult,
  ProjectGitDeliverySettings,
} from './git-delivery.types.js'

export class GitDeliveryPolicyError extends Error {}

export class GitDeliveryService {
  public constructor(
    private readonly repository: GitDeliveryRepository,
    private readonly projects: ProjectService,
    private readonly developerTools: DeveloperToolsService,
    private readonly systemTasks: SystemTaskService,
  ) {
    systemTasks.register('git-delivery.flow', (input, context) =>
      this.execute(readFlowTaskId(input), context),
    )
  }

  public getGlobalSettings() {
    return { settings: this.repository.getGlobal() }
  }

  public async setGlobalSettings(settings: GitDeliverySettings) {
    await this.repository.setGlobal(settings)
    return this.getGlobalSettings()
  }

  public getProjectSettings(projectId: string) {
    this.projects.get(projectId)
    const project = this.repository.getProject(projectId)
    return { effective: this.effective(project), project }
  }

  public async setProjectSettings(projectId: string, settings: ProjectGitDeliverySettings) {
    this.projects.get(projectId)
    await this.repository.setProject(projectId, settings)
    return this.getProjectSettings(projectId)
  }

  public list(projectId: string) {
    this.projects.get(projectId)
    return { flows: this.repository.listFlows(projectId) }
  }

  public async preview(projectId: string, title = 'Release changes') {
    const project = this.projects.get(projectId)
    const [git, release] = await Promise.all([
      this.developerTools.deliverySnapshot(projectId),
      readReleaseProfile(project.repositoryPath),
    ])
    const targetVersion = release.nextVersion ?? release.currentVersion
    const reference = targetVersion ? Number(targetVersion.split('.')[2]) : null
    return {
      branch: git.branch,
      canBumpVersion: release.canBumpVersion,
      canWriteChangelog: release.canWriteChangelog,
      changedFiles: git.changedFiles,
      currentVersion: release.currentVersion,
      githubUrl: project.githubUrl || git.remoteUrl,
      head: git.head,
      nextVersion: release.nextVersion,
      remoteUrl: git.remoteUrl,
      suggestedCommitMessage: reference === null ? title : `#${reference} - ${title}`,
      upstream: git.upstream,
    }
  }

  public async run(projectId: string, input: GitDeliveryFlowInput): Promise<GitDeliveryFlowRecord> {
    this.projects.get(projectId)
    const settings = this.effective(this.repository.getProject(projectId))
    if (!settings.enabled) throw new GitDeliveryPolicyError('Git delivery is disabled.')
    await this.requireReviewedState(projectId, input)

    const flow = createFlow(projectId, input)
    await this.repository.saveFlow(flow)
    const task = await this.systemTasks.enqueue({
      input: { flowId: flow.id },
      projectId,
      title: input.title,
      type: 'git-delivery.flow',
    })
    flow.systemTaskId = task.id
    await this.repository.saveFlow(flow)
    return flow
  }

  private async execute(
    flowId: string,
    context: SystemTaskContext,
  ): Promise<GitDeliveryFlowRecord> {
    const flow = this.repository.findFlow(flowId)
    if (!flow) throw new GitDeliveryPolicyError('Git delivery flow not found.')
    const project = this.projects.get(flow.projectId)
    flow.status = 'running'
    await this.repository.saveFlow(flow)

    try {
      await this.requireReviewedState(flow.projectId, flow.input)
      const release = await readReleaseProfile(project.repositoryPath)
      this.validateReleaseCommands(flow, release)

      await this.runStep(
        flow,
        context,
        'version',
        flow.input.bumpVersion,
        async () => {
          await bumpRepositoryVersion(project.repositoryPath, flow.input)
          return `Updated ${release.currentVersion} to ${release.nextVersion}.`
        },
        'Version update was not selected.',
      )
      await this.runStep(
        flow,
        context,
        'changelog',
        flow.input.writeChangelog,
        async () => {
          await appendRepositoryChangelog(project.repositoryPath, flow.input)
          return 'Added the release note to the changelog.'
        },
        'Changelog update was not selected.',
      )
      await this.runStep(
        flow,
        context,
        'sync',
        flow.input.syncStrategy !== 'none',
        async () => {
          await this.developerTools.runAction(flow.projectId, {
            action: 'sync',
            strategy: flow.input.syncStrategy === 'none' ? 'rebase' : flow.input.syncStrategy,
          })
          return `Pulled with ${flow.input.syncStrategy}.`
        },
        'Remote synchronization was not selected.',
      )
      await this.runStep(
        flow,
        context,
        'commit',
        true,
        async () => {
          await this.developerTools.runAction(flow.projectId, {
            action: 'commit',
            message: flow.input.commitMessage,
            stageAll: true,
          })
          return `Committed as ${flow.input.commitMessage}.`
        },
        '',
      )
      await this.runStep(
        flow,
        context,
        'push',
        flow.input.push,
        async () => {
          await this.developerTools.runAction(flow.projectId, {
            action: 'push',
            forceWithLease: false,
          })
          return 'Pushed the reviewed branch.'
        },
        'Push was not selected.',
      )

      flow.status = 'complete'
      flow.completedAt = new Date().toISOString()
      await this.repository.saveFlow(flow)
      return flow
    } catch (error) {
      flow.status = context.signal.aborted
        ? 'stopped'
        : hasInterruptedStep(flow)
          ? 'blocked'
          : 'failed'
      flow.error = toMessage(error)
      flow.completedAt = new Date().toISOString()
      await this.repository.saveFlow(flow)
      throw error
    }
  }

  private validateReleaseCommands(
    flow: GitDeliveryFlowRecord,
    release: Awaited<ReturnType<typeof readReleaseProfile>>,
  ): void {
    if (flow.input.bumpVersion && !release.canBumpVersion) {
      throw new GitDeliveryPolicyError('This repository does not expose version:bump.')
    }
    if (flow.input.writeChangelog && !release.canWriteChangelog) {
      throw new GitDeliveryPolicyError('This repository does not expose changelog:append.')
    }
  }

  private async runStep(
    flow: GitDeliveryFlowRecord,
    context: SystemTaskContext,
    id: GitDeliveryStepResult['id'],
    selected: boolean,
    action: () => Promise<string>,
    skippedMessage: string,
  ): Promise<void> {
    const existing = flow.steps.find((step) => step.id === id)
    if (existing?.status === 'complete' || existing?.status === 'skipped') return
    if (existing?.status === 'running') {
      existing.status = 'blocked'
      existing.message = 'Zetro stopped during this step. Review repository state before retrying.'
      await this.repository.saveFlow(flow)
      throw new GitDeliveryPolicyError(existing.message)
    }
    if (context.signal.aborted) throw new Error('Git delivery stopped.')
    if (!selected) {
      flow.steps.push({ id, message: skippedMessage, status: 'skipped' })
      await this.repository.saveFlow(flow)
      await context.step('skipped', skippedMessage)
      return
    }

    const step: GitDeliveryStepResult = { id, message: `Running ${id}.`, status: 'running' }
    flow.steps.push(step)
    await this.repository.saveFlow(flow)
    await context.step('info', step.message)
    try {
      step.message = await action()
      step.status = 'complete'
      await this.repository.saveFlow(flow)
      await context.step('completed', step.message)
    } catch (error) {
      step.message = toMessage(error)
      step.status = 'failed'
      await this.repository.saveFlow(flow)
      await context.step('failed', step.message)
      throw error
    }
  }

  private async requireReviewedState(projectId: string, input: GitDeliveryFlowInput) {
    const current = await this.developerTools.deliverySnapshot(projectId)
    if (!current.branch.startsWith('release/')) {
      throw new GitDeliveryPolicyError(
        'Create and review a release/* batch branch before running Git delivery. Zetro never releases directly from main or a task branch.',
      )
    }
    if (
      current.head !== input.expectedHead ||
      !sameFiles(current.changedFiles, input.expectedFiles)
    ) {
      throw new GitDeliveryPolicyError(
        'Repository changes differ from the reviewed preview. Refresh and review the flow again.',
      )
    }
  }

  private effective(project: ProjectGitDeliverySettings): GitDeliverySettings {
    if (project.inheritGlobal) return this.repository.getGlobal()
    const { inheritGlobal: _inheritGlobal, ...settings } = project
    return settings
  }
}

function createFlow(projectId: string, input: GitDeliveryFlowInput): GitDeliveryFlowRecord {
  return {
    completedAt: '',
    createdAt: new Date().toISOString(),
    error: null,
    id: randomUUID(),
    input,
    projectId,
    status: 'pending',
    steps: [],
    systemTaskId: null,
  }
}

function readFlowTaskId(value: unknown): string {
  if (typeof value === 'object' && value && 'flowId' in value && typeof value.flowId === 'string') {
    return value.flowId
  }
  throw new GitDeliveryPolicyError('The Git delivery task input is invalid.')
}

function hasInterruptedStep(flow: GitDeliveryFlowRecord): boolean {
  return flow.steps.some(({ status }) => status === 'blocked')
}

function sameFiles(left: string[], right: string[]): boolean {
  const sortedLeft = [...left].sort()
  const sortedRight = [...right].sort()
  return (
    sortedLeft.length === sortedRight.length &&
    sortedLeft.every((file, index) => file === sortedRight[index])
  )
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Git delivery failed.'
}
