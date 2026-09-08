import type { CodexDeliveryRun, CodexWorkflow } from '../codex-connection/index.js'

export type ChatRole = 'assistant' | 'user'

export interface ChatAttachment {
  dataUrl: string
  id: string
  mimeType: string
  name: string
}

export interface ChatMessage {
  attachments: readonly ChatAttachment[]
  content: string
  role: ChatRole
}

export interface ChatTurnRequest {
  conversationId: string
  messages: readonly ChatMessage[]
  previousDelivery?: CodexDeliveryRun
  workflow: CodexWorkflow
}

export interface ChatTurnResponse {
  execution: ChatTurnExecution
  message: {
    content: string
    role: 'assistant'
  }
  model: string
  responseId: string
}

export interface ChatTurnExecution {
  activities: readonly {
    kind: 'command' | 'file_change' | 'mcp'
    label: string
    status: string
  }[]
  delivery?: CodexDeliveryRun
  isolation: 'ephemeral-thread'
  tools: readonly string[]
  worktreePath: string
  workflow: CodexWorkflow
}

export interface ChatProvider {
  respond(request: ChatTurnRequest): Promise<ChatTurnResponse>
}
