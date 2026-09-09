import { randomUUID } from 'node:crypto'
import type { DeveloperToolsService } from '../developer-tools/index.js'
import type { ProjectService } from '../projects/index.js'
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
  ) {}

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
    const project = this.projects.get(projectId)
    const settings = this.effective(this.repository.getProject(projectId))
    if (!settings.enabled) throw new GitDeliveryPolicyError('Git delivery is disabled.')
    await this.requireReviewedState(projectId, input)

    const flow = createFlow(projectId, input)
    await this.repository.saveFlow(flow)
    try {
      const release = await readReleaseProfile(project.repositoryPath)
      if (input.bumpVersion && !release.canBumpVersion)
        throw new GitDeliveryPolicyError('This repository does not expose version:bump.')
      if (input.writeChangelog && !release.canWriteChangelog)
        throw new GitDeliveryPolicyError('This repository does not expose changelog:append.')

      if (input.bumpVersion) {
        await bumpRepositoryVersion(project.repositoryPath, input)
        flow.steps.push(
          complete('version', `Updated ${release.currentVersion} to ${release.nextVersion}.`),
        )
      } else flow.steps.push(skipped('version', 'Version update was not selected.'))

      if (input.writeChangelog) {
        await appendRepositoryChangelog(project.repositoryPath, input)
        flow.steps.push(complete('changelog', 'Added the release note to the changelog.'))
      } else flow.steps.push(skipped('changelog', 'Changelog update was not selected.'))

      if (input.syncStrategy !== 'none') {
        await this.developerTools.runAction(projectId, {
          action: 'sync',
          strategy: input.syncStrategy,
        })
        flow.steps.push(complete('sync', `Pulled with ${input.syncStrategy}.`))
      } else flow.steps.push(skipped('sync', 'Remote synchronization was not selected.'))

      await this.developerTools.runAction(projectId, {
        action: 'commit',
        message: input.commitMessage,
        stageAll: true,
      })
      flow.steps.push(complete('commit', `Committed as ${input.commitMessage}.`))

      if (input.push) {
        await this.developerTools.runAction(projectId, { action: 'push', forceWithLease: false })
        flow.steps.push(complete('push', 'Pushed the reviewed branch.'))
      } else flow.steps.push(skipped('push', 'Push was not selected.'))

      flow.status = 'complete'
      flow.completedAt = new Date().toISOString()
      await this.repository.saveFlow(flow)
      return flow
    } catch (error) {
      flow.status = 'failed'
      flow.error = toMessage(error)
      flow.completedAt = new Date().toISOString()
      await this.repository.saveFlow(flow)
      throw error
    }
  }

  private async requireReviewedState(projectId: string, input: GitDeliveryFlowInput) {
    const current = await this.developerTools.deliverySnapshot(projectId)
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
    status: 'running',
    steps: [],
  }
}

function complete(id: GitDeliveryStepResult['id'], message: string): GitDeliveryStepResult {
  return { id, message, status: 'complete' }
}

function skipped(id: GitDeliveryStepResult['id'], message: string): GitDeliveryStepResult {
  return { id, message, status: 'skipped' }
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
