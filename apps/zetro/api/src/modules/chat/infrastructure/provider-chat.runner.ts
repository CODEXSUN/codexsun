import type {
  ProviderConnection,
  ProviderSelectionConfirmation,
  ProviderSelectionRequest,
} from '@codexsun/zetro-contracts'
import type {
  ProviderRunRequest,
  ProviderRunResult,
  ProviderRunner,
} from '../../providers/index.js'
import type { ProviderService } from '../../providers/index.js'
import { displayModel, type CodexChatClient } from './codex-chat.client.js'
import type { CxzChatClient } from './cxz-chat.client.js'

export class ProviderChatRunner implements ProviderRunner {
  private readonly activeKinds = new Map<string, ProviderConnection['kind']>()

  constructor(
    private readonly providers: ProviderService,
    private readonly codex: CodexChatClient,
    private readonly cxz: CxzChatClient,
  ) {}

  getActiveConnection(): ProviderConnection {
    return this.providers.getActiveConnection()
  }

  resolveConnection(selection: ProviderSelectionRequest): ProviderConnection {
    return this.providers.resolveConnection(selection)
  }

  confirmSelection(selection: ProviderSelectionRequest): Promise<ProviderSelectionConfirmation> {
    return this.providers.confirmSelection(selection)
  }

  async run(request: ProviderRunRequest): Promise<ProviderRunResult> {
    if (isRuntimeIdentityRequest(request.prompt)) {
      const content = runtimeIdentity(request.connection)
      request.onEvent({ delta: content, type: 'response' })
      return { content, status: 'complete' }
    }
    this.activeKinds.set(request.conversationId, request.connection.kind)
    try {
      if (request.connection.kind === 'cxz-codex') {
        if (request.imagePaths?.length) throw new Error('CXZ image input needs its shared artifact mount. Use Local Codex for now.')
        return await this.cxz.run(request)
      }
      return await this.codex.run(
        request.conversationId,
        request.prompt,
        request.onEvent,
        request.providerThreadId,
        request.onProviderThread,
        request.connection.model,
        request.connection.reasoningEffort,
        request.imagePaths ?? [],
      )
    } finally {
      this.activeKinds.delete(request.conversationId)
    }
  }

  async stop(conversationId: string): Promise<void> {
    const kind = this.activeKinds.get(conversationId)
    if (kind === 'cxz-codex') return this.cxz.stop(conversationId)
    return this.codex.stop(conversationId)
  }

  async close(): Promise<void> {
    await this.codex.close()
  }
}

export function isRuntimeIdentityRequest(prompt: string) {
  const value = prompt.toLowerCase()
  return (
    /\b(model|provider)\b/.test(value) &&
    /\breasoning\b/.test(value) &&
    /\b(tell|what|which)\b/.test(value) &&
    /\b(your|runtime)\b/.test(value)
  )
}

export function runtimeIdentity(connection: ProviderConnection) {
  const runtime = connection.kind === 'cxz-codex' ? 'CXZ' : 'Codex'
  const model = connection.model ? displayModel(connection.model) : 'the selected model'
  const providerModel = connection.kind === 'cxz-codex' ? `Codex ${model}` : model
  return `I am ${runtime}, powered by ${providerModel} with ${connection.reasoningEffort} reasoning.`
}
