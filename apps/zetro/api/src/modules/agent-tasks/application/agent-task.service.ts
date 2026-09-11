import type {
  AgentTaskDraft,
  AgentTaskFromChatRequest,
  AgentTaskPlan,
  AgentTaskSummary,
} from '@codexsun/zetro-contracts'
import { randomUUID } from 'node:crypto'
import type { AgentTaskSource, AgentTaskStore } from './agent-task.ports.js'

export class AgentTaskService {
  constructor(
    private readonly repository: AgentTaskStore,
    private readonly source: AgentTaskSource,
  ) {}

  createFromChat(request: AgentTaskFromChatRequest): AgentTaskDraft {
    const source = this.source.getTaskSource(request.conversationId, request.turnId)
    const now = Date.now()
    return this.repository.createOrGet({
      createdAt: now,
      id: randomUUID(),
      originConversationId: request.conversationId,
      originTurnId: request.turnId,
      sourcePrompt: source.prompt,
      sourceResponse: source.response,
      title: taskTitle(source.prompt),
    })
  }

  get(taskId: string): AgentTaskDraft {
    const task = this.repository.get(taskId)
    if (!task) throw new AgentTaskNotFoundError()
    return task
  }

  isReady(): boolean {
    return this.repository.isReady()
  }

  list(): AgentTaskSummary[] {
    return this.repository.list()
  }

  updatePlan(taskId: string, plan: AgentTaskPlan): AgentTaskDraft {
    this.get(taskId)
    return this.repository.updatePlan(taskId, plan)
  }

  confirmReview(taskId: string): AgentTaskDraft {
    const task = this.get(taskId)
    if (
      !task.repositoryPath ||
      !task.modulePath ||
      !task.acceptanceCriteria.length ||
      !task.checks.length
    ) {
      throw new Error(
        'Repository, scope, acceptance criteria, and verification checks are required.',
      )
    }
    return this.repository.confirmReview(taskId, Date.now())
  }

  close(): void {
    this.repository.close()
  }
}

export class AgentTaskNotFoundError extends Error {
  constructor() {
    super('Agent task draft was not found.')
  }
}

function taskTitle(prompt: string) {
  const title = prompt.replace(/\s+/g, ' ').trim().slice(0, 120)
  return title || 'Untitled task draft'
}
