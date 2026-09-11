import {
  agentTaskDraftSchema,
  agentTaskFromChatRequestSchema,
  agentTaskListResponseSchema,
  agentTaskPlanRequestSchema,
  agentTaskReviewConfirmationSchema,
  type AgentTaskDraft,
  type AgentTaskPlan,
  type AgentTaskSummary,
} from '@codexsun/zetro-contracts'

const baseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? 'http://127.0.0.1:6050').replace(/\/$/, '')

export async function fetchAgentTasks(): Promise<AgentTaskSummary[]> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/agent-tasks`)
  const result = agentTaskListResponseSchema.parse(
    await readJson(response, 'Could not load tasks.'),
  )
  return result.tasks
}

export async function fetchAgentTask(taskId: string): Promise<AgentTaskDraft> {
  const response = await fetch(`${baseUrl}/api/zetro/v1/agent-tasks/${encodeURIComponent(taskId)}`)
  return agentTaskDraftSchema.parse(await readJson(response, 'Could not load the task draft.'))
}

export async function createAgentTaskFromChat(conversationId: string, turnId: string) {
  const body = agentTaskFromChatRequestSchema.parse({ conversationId, turnId })
  const response = await fetch(`${baseUrl}/api/zetro/v1/agent-tasks/from-chat`, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  return agentTaskDraftSchema.parse(
    await readJson(response, 'Could not create a task draft from this response.'),
  )
}

export async function saveAgentTaskPlan(taskId: string, plan: AgentTaskPlan) {
  const body = agentTaskPlanRequestSchema.parse(plan)
  const response = await fetch(
    `${baseUrl}/api/zetro/v1/agent-tasks/${encodeURIComponent(taskId)}/plan`,
    {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    },
  )
  return agentTaskDraftSchema.parse(await readJson(response, 'Could not save the task plan.'))
}

export async function confirmAgentTaskReview(taskId: string) {
  const body = agentTaskReviewConfirmationSchema.parse({ confirmed: true })
  const response = await fetch(
    `${baseUrl}/api/zetro/v1/agent-tasks/${encodeURIComponent(taskId)}/confirm-review`,
    {
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  )
  return agentTaskDraftSchema.parse(await readJson(response, 'Could not confirm the task review.'))
}

async function readJson(response: Response, fallback: string): Promise<unknown> {
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new Error(errorFromBody(body) ?? fallback)
  return body
}

function errorFromBody(body: unknown) {
  if (!body || typeof body !== 'object') return undefined
  const error = Reflect.get(body, 'error')
  return typeof error === 'string' ? error : undefined
}
