import {
  providerModelListResponseSchema,
  providerSelectionConfirmationSchema,
  type ProviderConnection,
  type ProviderConnectionTestResponse,
  type ProviderModel,
  type ProviderSelectionConfirmation,
  type ProviderSelectionRequest,
  type ProviderSettingsResponse,
} from '@codexsun/zetro-contracts'
import type { CodexProviderControl, ProviderStore } from './provider.ports.js'

const remoteTimeoutMilliseconds = 3_000

export class ProviderService {
  constructor(
    private readonly store: ProviderStore,
    private readonly codex: CodexProviderControl,
  ) {}

  getSettings(): ProviderSettingsResponse {
    return this.store.getSettings()
  }

  getActiveConnection(): ProviderConnection {
    const settings = this.store.getSettings()
    const connection = settings.connections.find(({ id }) => id === settings.selectedConnectionId)
    if (!connection) throw new Error('The selected provider connection is unavailable.')
    if (!connection.enabled) throw new Error('The selected provider connection is disabled.')
    return connection
  }

  resolveConnection(selection: ProviderSelectionRequest): ProviderConnection {
    const connection = this.requireConnection(selection.connectionId)
    if (!connection.enabled) throw new Error('This provider connection is not enabled yet.')
    return {
      ...connection,
      model: selection.model ?? connection.model,
      reasoningEffort: selection.reasoningEffort,
    }
  }

  async confirmSelection(
    selection: ProviderSelectionRequest,
  ): Promise<ProviderSelectionConfirmation> {
    return this.confirmSelectionForRuntime(selection, false)
  }

  async select(selection: ProviderSelectionRequest): Promise<ProviderSettingsResponse> {
    const confirmation = await this.confirmSelectionForRuntime(selection, true)
    const confirmedSelection = {
      connectionId: confirmation.connectionId,
      model: confirmation.model,
      reasoningEffort: confirmation.reasoningEffort,
    }
    const settings = this.store.select(confirmedSelection, confirmation.confirmedAt)
    return { ...settings, confirmation }
  }

  private async confirmSelectionForRuntime(
    selection: ProviderSelectionRequest,
    restartLocalRuntime: boolean,
  ): Promise<ProviderSelectionConfirmation> {
    const { connection, confirmedSelection } = await this.prepareSelection(
      selection,
      restartLocalRuntime,
    )
    const confirmation =
      connection.kind === 'cxz-codex'
        ? await this.confirmRemoteSelection(connection, confirmedSelection)
        : await this.confirmLocalSelection(connection, confirmedSelection)
    this.store.updateAccount(
      connection.id,
      'authenticated',
      confirmation.accountLabel,
      confirmation.confirmedAt,
    )
    return confirmation
  }

  async listModels(connectionId: string): Promise<ProviderModel[]> {
    const connection = this.requireConnection(connectionId)
    if (!connection.enabled) return []
    const visible = await this.loadModels(connection)
    const selected =
      connection.model ?? visible.find(({ isDefault }) => isDefault)?.id ?? visible[0]?.id
    if (selected && selected !== connection.model)
      this.store.updateModel(connection.id, selected, Date.now())
    return visible
  }

  async refreshAccount(connectionId = 'codex-local'): Promise<ProviderSettingsResponse> {
    const connection = this.requireConnection(connectionId)
    try {
      const account =
        connection.kind === 'codex-app-server'
          ? await this.codex.readAccount()
          : await this.readRemoteAccount(connection)
      this.store.updateAccount(
        connection.id,
        account.authenticated ? 'authenticated' : 'not-authenticated',
        account.label,
        Date.now(),
      )
    } catch {
      this.store.updateAccount(connection.id, 'error', undefined, Date.now())
    }
    return this.store.getSettings()
  }

  async startDeviceLogin(connectionId = 'codex-local') {
    const connection = this.requireConnection(connectionId)
    if (connection.kind !== 'codex-app-server' && connection.kind !== 'cxz-codex') {
      throw new Error('This provider does not support Codex device login.')
    }
    this.store.updateAccount(connection.id, 'pending', undefined, Date.now())
    try {
      if (connection.kind === 'cxz-codex') return await this.startRemoteDeviceLogin(connection)
      return await this.codex.startDeviceLogin((success) => {
        if (!success) {
          this.store.updateAccount(connection.id, 'error', undefined, Date.now())
          return
        }
        void this.refreshAccount(connection.id)
      })
    } catch (error) {
      this.store.updateAccount(connection.id, 'error', undefined, Date.now())
      throw error
    }
  }

  async testConnection(connectionId: string): Promise<ProviderConnectionTestResponse> {
    const connection = this.requireConnection(connectionId)
    if (connection.kind === 'codex-app-server') {
      const account = await this.codex.readAccount()
      const models = await this.codex.listModels()
      return account.authenticated
        ? { message: `Codex is authenticated and returned ${models.length} models.`, ok: true }
        : { message: 'Codex requires device login.', ok: false }
    }
    const response = await fetch(`${connection.baseUrl}/health/ready`, {
      signal: AbortSignal.timeout(remoteTimeoutMilliseconds),
    })
    const body = (await response.json().catch(() => undefined)) as { message?: string } | undefined
    return {
      message:
        body?.message ??
        (response.ok ? 'The provider gateway is ready.' : 'The provider gateway is not ready.'),
      ok: response.ok,
    }
  }

  isReady(): boolean {
    return this.store.isReady()
  }

  close(): void {
    this.store.close()
  }

  private requireConnection(connectionId: string): ProviderConnection {
    const connection = this.store.getConnection(connectionId)
    if (!connection) throw new Error('Provider connection was not found.')
    return connection
  }

  private async readRemoteAccount(connection: ProviderConnection) {
    if (!connection.baseUrl) throw new Error('The provider URL is missing.')
    const response = await fetch(`${connection.baseUrl}/account`, {
      signal: AbortSignal.timeout(remoteTimeoutMilliseconds),
    })
    const body = (await response.json().catch(() => undefined)) as unknown
    if (!response.ok) throw new Error(errorFromBody(body) ?? 'Could not read provider account.')
    if (!body || typeof body !== 'object')
      throw new Error('The provider returned an invalid account.')
    return {
      authenticated: Reflect.get(body, 'authenticated') === true,
      label:
        typeof Reflect.get(body, 'label') === 'string'
          ? (Reflect.get(body, 'label') as string)
          : undefined,
    }
  }

  private async startRemoteDeviceLogin(connection: ProviderConnection) {
    if (!connection.baseUrl) throw new Error('The provider URL is missing.')
    const response = await fetch(`${connection.baseUrl}/device-login`, {
      method: 'POST',
      signal: AbortSignal.timeout(remoteTimeoutMilliseconds),
    })
    const body = await response.json().catch(() => undefined)
    if (!response.ok) throw new Error(errorFromBody(body) ?? 'Could not start device login.')
    return body
  }

  private async readGatewayModels(connection: ProviderConnection): Promise<ProviderModel[]> {
    if (!connection.baseUrl) throw new Error('The provider gateway URL is missing.')
    const response = await fetch(`${connection.baseUrl}/models`, {
      signal: AbortSignal.timeout(remoteTimeoutMilliseconds),
    })
    const body = await response.json().catch(() => undefined)
    if (!response.ok) throw new Error(errorFromBody(body) ?? 'Could not load gateway models.')
    return providerModelListResponseSchema.parse(body).models
  }

  private async loadModels(connection: ProviderConnection): Promise<ProviderModel[]> {
    const models =
      connection.kind === 'codex-app-server'
        ? await this.codex.listModels()
        : await this.readGatewayModels(connection)
    return models.filter(({ id }) => Boolean(id))
  }

  private async prepareSelection(
    selection: ProviderSelectionRequest,
    restartLocalRuntime: boolean,
  ) {
    const connection = this.requireConnection(selection.connectionId)
    if (!connection.enabled) throw new Error('This provider connection is not enabled yet.')
    if (connection.kind === 'codex-app-server' && restartLocalRuntime) await this.codex.restart()
    const models = await this.loadModels(connection)
    const modelId = selection.model ?? connection.model
    const model = models.find(({ id }) => id === modelId)
    if (!model) throw new Error('The selected model is unavailable for this connection.')
    if (
      model.supportedReasoningEfforts.length > 0 &&
      !model.supportedReasoningEfforts.includes(selection.reasoningEffort)
    ) {
      throw new Error('The selected reasoning level is unavailable for this model.')
    }
    return { connection, confirmedSelection: { ...selection, model: model.id } }
  }

  private async confirmLocalSelection(
    connection: ProviderConnection,
    selection: ProviderSelectionRequest & { model: string },
  ): Promise<ProviderSelectionConfirmation> {
    const account = await this.codex.readAccount()
    if (!account.authenticated) throw new Error('Codex requires device authentication.')
    const smoke = await this.codex.smoke(selection.model, selection.reasoningEffort)
    return {
      accountLabel: account.label,
      confirmedAt: Date.now(),
      connected: true,
      connectionId: connection.id,
      model: selection.model,
      providerLabel: connection.label,
      reasoningEffort: selection.reasoningEffort,
      runtime: 'local',
      smoke,
    }
  }

  private async confirmRemoteSelection(
    connection: ProviderConnection,
    selection: ProviderSelectionRequest & { model: string },
  ): Promise<ProviderSelectionConfirmation> {
    if (!connection.baseUrl) throw new Error('The CXZ URL is missing.')
    const response = await fetch(`${connection.baseUrl}/selection/confirm`, {
      body: JSON.stringify(selection),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(35_000),
    })
    const body = await response.json().catch(() => undefined)
    if (!response.ok) throw new Error(errorFromBody(body) ?? 'CXZ could not confirm the selection.')
    return providerSelectionConfirmationSchema.parse(body)
  }
}

function errorFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const value = Reflect.get(body, 'error') ?? Reflect.get(body, 'message')
  return typeof value === 'string' ? value : undefined
}
