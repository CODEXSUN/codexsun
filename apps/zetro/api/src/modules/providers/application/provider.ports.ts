import type {
  ChatStreamEvent,
  ProviderConnection,
  ProviderDeviceLoginResponse,
  ProviderModel,
  ProviderSelectionRequest,
  ProviderSelectionConfirmation,
  ProviderSettingsResponse,
} from '@codexsun/zetro-contracts'

export type ProviderAccount = {
  authenticated: boolean
  label?: string
}

export type ProviderMessage = { content: string; role: 'assistant' | 'user' }

export type ProviderRunRequest = {
  connection: ProviderConnection
  conversationId: string
  imagePaths?: string[]
  messages: ProviderMessage[]
  onEvent(event: ChatStreamEvent): void
  onProviderThread(threadId: string): void
  prompt: string
  providerThreadId?: string
}

export type ProviderRunResult = { content: string; status: 'complete' | 'stopped' }

export interface ProviderStore {
  close(): void
  getConnection(connectionId: string): ProviderConnection | undefined
  getSettings(): ProviderSettingsResponse
  isReady(): boolean
  select(selection: ProviderSelectionRequest, updatedAt: number): ProviderSettingsResponse
  updateAccount(
    connectionId: string,
    authStatus: ProviderConnection['authStatus'],
    accountLabel: string | undefined,
    updatedAt: number,
  ): void
  updateModel(connectionId: string, model: string, updatedAt: number): void
}

export interface CodexProviderControl {
  listModels(): Promise<ProviderModel[]>
  readAccount(): Promise<ProviderAccount>
  restart(): Promise<void>
  smoke(
    model: string,
    effort: ProviderConnection['reasoningEffort'],
  ): Promise<{
    completedAt: number
    latencyMs: number
    ok: true
    response: 'ZETRO_SMOKE_OK'
  }>
  startDeviceLogin(
    onComplete: (success: boolean, error?: string) => void,
  ): Promise<ProviderDeviceLoginResponse>
}

export interface ProviderRunner {
  close(): Promise<void>
  confirmSelection(selection: ProviderSelectionRequest): Promise<ProviderSelectionConfirmation>
  getActiveConnection(): ProviderConnection
  resolveConnection(selection: ProviderSelectionRequest): ProviderConnection
  run(request: ProviderRunRequest): Promise<ProviderRunResult>
  stop(conversationId: string): Promise<void>
}
