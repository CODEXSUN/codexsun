import { randomUUID } from 'node:crypto'
import {
  validateChatWorkspaceScope,
  type ChatConversationService,
  type ChatService,
} from '../chat/index.js'
import type { ProjectService } from '../projects/index.js'
import type { SystemTaskContext, SystemTaskService } from '../system-tasks/index.js'
import { supervisorExecutionSchema, type SupervisorJobInput } from './supervisor.schema.js'
import { SupervisorProgress } from './supervisor.progress.js'

const jobType = 'supervisor.agent-turn'

export class SupervisorPolicyError extends Error {}

export class SupervisorService {
  private submission: Promise<unknown> = Promise.resolve()

  public constructor(
    private readonly projects: Pick<ProjectService, 'get' | 'list' | 'create'>,
    private readonly chat: ChatService,
    private readonly conversations: ChatConversationService,
    private readonly tasks: SystemTaskService,
  ) {
    tasks.register(jobType, (input, context) => this.execute(input, context), {
      singleAttempt: true,
    })
  }

  public listProjects() {
    return this.projects.list()
  }

  public async connectProject(input: { name: string; repositoryPath: string }) {
    try {
      return await this.projects.create(input)
    } catch (error) {
      throw new SupervisorPolicyError(
        error instanceof Error ? error.message : 'Project registration failed.',
      )
    }
  }

  public async list() {
    return (await this.tasks.list()).filter((task) => task.type === jobType)
  }

  public async get(taskId: string) {
    const task = await this.tasks.get(taskId)
    if (task.type !== jobType)
      throw new SupervisorPolicyError('This task is not owned by the supervisor.')
    return task
  }

  public async stop(taskId: string) {
    await this.get(taskId)
    return this.tasks.stop(taskId)
  }

  public submit(input: SupervisorJobInput) {
    const result = this.submission.then(() => this.enqueue(input))
    this.submission = result.catch(() => undefined)
    return result
  }

  private async enqueue(input: SupervisorJobInput) {
    const project = this.projects.get(input.projectId)
    if (project.archived) throw new SupervisorPolicyError('The project is archived.')
    const scope = await validateChatWorkspaceScope(project.repositoryPath, input.scope)
    const active = (await this.tasks.listActive()).some(
      (task) => task.projectId === project.id && task.type === jobType,
    )
    if (active)
      throw new SupervisorPolicyError('A supervisor job is already active for this project.')
    const conversation = await this.conversations.create(
      project.id,
      [
        {
          attachments: [],
          content: input.prompt,
          createdAt: new Date().toISOString(),
          id: randomUUID(),
          role: 'user',
        },
      ],
      scope,
    )
    return this.tasks.enqueue({
      input: { ...input, scope, conversationId: conversation.id },
      projectId: project.id,
      title: `Supervisor: ${input.prompt.slice(0, 100)}`,
      type: jobType,
    })
  }

  private async execute(raw: unknown, context: SystemTaskContext) {
    const input = supervisorExecutionSchema.parse(raw)
    const project = this.projects.get(input.projectId)
    if (project.archived) throw new SupervisorPolicyError('The project is archived.')
    const scope = await validateChatWorkspaceScope(project.repositoryPath, input.scope)
    const conversation = this.conversations.get(input.conversationId)
    if (conversation.projectId !== project.id || conversation.archivedAt) {
      throw new SupervisorPolicyError('The conversation is unavailable for this project.')
    }
    context.signal.throwIfAborted()
    await context.step(
      'info',
      `Agent turn started. Conversation: ${conversation.id}. Workflow: ${input.workflow}.`,
    )
    let stopFailure: unknown
    const stop = () => {
      void this.chat.stop(conversation.id).catch((error: unknown) => {
        stopFailure = error
      })
    }
    const progress = new SupervisorProgress(context)
    const response = this.chat.respond({
      onProgress: progress.receive,
      conversationId: conversation.id,
      messages: conversation.messages,
      projectId: project.id,
      projectRoot: project.repositoryPath,
      scope,
      workflow: input.workflow,
      model: input.model,
      reasoningEffort: input.reasoningEffort,
    })
    context.signal.addEventListener('abort', stop, { once: true })
    if (context.signal.aborted) stop()
    try {
      const result = await response
      const current = this.conversations.get(conversation.id)
      await this.conversations.update(conversation.id, {
        messages: [
          ...current.messages,
          {
            ...result.message,
            attachments: [],
            createdAt: new Date().toISOString(),
            execution: result.execution,
            id: randomUUID(),
          },
        ],
      })
      const failed = result.execution.activities.filter((activity) => activity.status === 'failed')
      if (failed.length > 0) {
        await context.step(
          'failed',
          `Provider reported ${failed.length} failed tool action(s). Review conversation ${conversation.id}.`,
        )
        throw new SupervisorPolicyError(
          `Provider tool failure: ${failed
            .map((activity) => activity.details || activity.label)
            .join('\n')
            .slice(0, 2_000)}`,
        )
      }
      await context.step(
        'completed',
        `Agent result saved. Worktree: ${result.execution.worktreePath}`,
      )
      return { conversationId: conversation.id, ...result }
    } finally {
      context.signal.removeEventListener('abort', stop)
      await progress.close()
      if (stopFailure)
        await context.step(
          'failed',
          'Provider cancellation failed. Review the active provider turn.',
        )
    }
  }
}
