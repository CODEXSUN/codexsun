import { randomUUID } from 'node:crypto'
import type { CodexAppServerClient, CodexWorkflow } from '../codex-connection/index.js'
import type { ChatMessage, ChatProvider, ChatTurnRequest, ChatTurnResponse } from './chat.types.js'

const codingTools = [
  'Read files',
  'Search code',
  'Edit files',
  'Run commands',
  'Run tests',
  'Review Git changes',
] as const

const deliveryTools = [
  ...codingTools,
  'Assign task ownership',
  'Update documentation',
  'Record changelog',
  'Version repository',
  'Commit and push',
] as const

export class CodexAppServerProvider implements ChatProvider {
  public constructor(private readonly client: CodexAppServerClient) {}

  public async respond(request: ChatTurnRequest): Promise<ChatTurnResponse> {
    try {
      const result = await this.client.runTurn({
        conversationId: request.conversationId,
        files: request.messages.flatMap((message) =>
          message.attachments
            .filter((attachment) => !attachment.mimeType.startsWith('image/'))
            .map(({ dataUrl, id, name }) => ({ dataUrl, id, name })),
        ),
        images: request.messages.flatMap((message) =>
          message.attachments
            .filter((attachment) => attachment.mimeType.startsWith('image/'))
            .map((attachment) => attachment.dataUrl),
        ),
        text: toCodexPrompt(request.messages, request.scope, request.previousDelivery),
        projectId: request.projectId,
        projectRoot: request.projectRoot,
        scope: request.scope,
        workflow: request.workflow,
      })

      return {
        execution: {
          activities: result.activities,
          delivery: result.delivery,
          isolation: 'ephemeral-thread',
          tools: toolsForWorkflow(result.workflow),
          worktreePath: result.worktreePath,
          workflow: result.workflow,
        },
        message: { content: result.content, role: 'assistant' },
        model: 'codex-app-server',
        responseId: randomUUID(),
      }
    } catch (error) {
      throw new ChatProviderError(
        503,
        error instanceof Error ? error.message : 'The local Codex connection failed.',
      )
    }
  }

  public stop(conversationId: string): Promise<boolean> {
    return this.client.interruptTurn(conversationId)
  }
}

function toolsForWorkflow(workflow: CodexWorkflow): readonly string[] {
  return workflow === 'deliver' ? deliveryTools : codingTools
}

export class ChatProviderError extends Error {
  public constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
  }
}

function toCodexPrompt(
  messages: readonly ChatMessage[],
  scope: ChatTurnRequest['scope'],
  previousDelivery?: ChatTurnRequest['previousDelivery'],
): string {
  const transcript = messages
    .map((message) => {
      const files = message.attachments
        .filter((attachment) => !attachment.mimeType.startsWith('image/'))
        .map((attachment) => attachment.name)
      const fileNote = files.length ? `\nAttached files: ${files.join(', ')}` : ''
      return `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}${fileNote}`
    })
    .join('\n\n')

  return [
    'Act as Zetro, a concise agentic AI collaborator. Help the user plan and complete work.',
    'Return only the final user-visible answer. Do not expose private reasoning.',
    `Connected application: ${scope.application}`,
    scope.module ? `Connected module: ${scope.module}` : '',
    `Connected folder: ${scope.folderPath}`,
    'Treat the connected folder as the task scope. Read outside it only for required repository guidance or declared dependencies.',
    formatPreviousDelivery(previousDelivery),
    '',
    transcript,
  ]
    .filter(Boolean)
    .join('\n')
}

function formatPreviousDelivery(delivery?: ChatTurnRequest['previousDelivery']): string {
  if (!delivery) return ''
  return [
    'Previous validated delivery record. Continue from this evidence and recheck stale facts:',
    ...delivery.stages.map(
      (stage) => `- ${stage.id} [${stage.status}] ${stage.evidence} (${stage.updatedAt})`,
    ),
  ].join('\n')
}
