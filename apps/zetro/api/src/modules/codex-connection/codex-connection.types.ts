import type { CodexWorkflow } from './codex-workflow.js'
import type { CodexModel, CodexReasoningEffort } from './codex-model.js'

export type CodexConnectionMode = 'api_key' | 'chatgpt' | 'none'
export type CodexConnectionState = 'connected' | 'disconnected' | 'error' | 'pending'

export interface CodexConnectionStatus {
  email?: string
  message?: string
  mode: CodexConnectionMode
  planType?: string
  state: CodexConnectionState
}

export interface CodexDeviceCode {
  loginId: string
  userCode: string
  verificationUrl: string
}

export interface CodexTurnInput {
  onProgress?(event: CodexProgressEvent): void
  conversationId: string
  files: readonly {
    dataUrl: string
    id: string
    name: string
  }[]
  images: readonly string[]
  model?: CodexModel
  projectId: string
  projectRoot: string
  scope: {
    application: string
    folderPath: string
    module: string
  }
  text: string
  reasoningEffort: CodexReasoningEffort
  workflow: CodexWorkflow
}

export type CodexProgressEvent =
  { kind: 'tool'; itemId: string; activity: CodexToolActivity } | { kind: 'response'; text: string }

export type CodexDeliveryStageId =
  | 'plan'
  | 'observe'
  | 'review'
  | 'assign'
  | 'implement'
  | 'verify'
  | 'document'
  | 'version'
  | 'publish'

export type CodexDeliveryStageStatus = 'blocked' | 'complete' | 'ready' | 'skipped'

export interface CodexDeliveryRun {
  publicationReady: boolean
  stages: readonly {
    evidence: string
    id: CodexDeliveryStageId
    status: CodexDeliveryStageStatus
    updatedAt: string
  }[]
}

export type CodexToolKind = 'command' | 'file_change' | 'mcp'

export interface CodexToolActivity {
  details?: string
  kind: CodexToolKind
  label: string
  status: string
}

export interface CodexTurnResult {
  activities: readonly CodexToolActivity[]
  content: string
  delivery?: CodexDeliveryRun
  model: string
  threadId: string
  worktreePath: string
  workflow: CodexWorkflow
}
