import { execFile } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export type CodeloopProviderId = 'anthropic' | 'codex' | 'gemini' | 'ollama' | 'openai' | 'openrouter'
export type ProviderConnectionResult = { message: string; models?: string[]; status: 'connected' | 'error' }

export function isAgentCrewTarget(endpoint: string, agentCrewApiUrl?: string): boolean {
  const normalized = trimEndpoint(endpoint).toLowerCase()
  const normalizedCrew = agentCrewApiUrl ? trimEndpoint(agentCrewApiUrl).toLowerCase() : 'http://127.0.0.1:6411'
  return normalized === normalizedCrew || normalized.endsWith(':6411') || normalized.includes('/agentcrew')
}

export async function verifyProviderConnection(input: { apiKey?: string; endpoint: string; model?: string; providerId: CodeloopProviderId }, integration: { agentCrewApiUrl?: string; agentCrewToken?: string } = {}, signal?: AbortSignal): Promise<ProviderConnectionResult> {
  if (input.providerId === 'codex') return verifyCodex()
  if (input.providerId === 'ollama') {
    const isCrew = isAgentCrewTarget(input.endpoint, integration.agentCrewApiUrl)
    const tokens = [input.apiKey?.trim(), isCrew ? integration.agentCrewToken?.trim() : undefined].filter((t, i, arr): t is string => Boolean(t) && arr.indexOf(t) === i)

    for (const token of tokens) {
      const crewResult = await verifyAgentCrewOllama(input.endpoint, input.model, token, signal)
      if (crewResult.status === 'connected') return crewResult
    }

    // Direct Ollama endpoint check (or fallback if AgentCrew proxy failed)
    const directResult = await verifyOllama(input.endpoint, signal)
    if (directResult.status === 'connected') return directResult

    if (isCrew) {
      return { message: 'AgentCrew returned HTTP 401 (Unauthorized). Check AGENTCREW_TOKEN in .app.env or the access token in settings.', status: 'error' }
    }
    return directResult
  }
  if (!input.apiKey) return { message: 'Enter an API key before verifying this provider.', status: 'error' }
  if (input.providerId === 'gemini') return verifyGemini(input.endpoint, input.apiKey)
  return verifyOpenAiCompatible(input.providerId, input.endpoint, input.apiKey)
}

async function verifyCodex(): Promise<ProviderConnectionResult> {
  try {
    await execFileAsync(codexCommand(), ['login', 'status'], { timeout: 10_000, windowsHide: true })
    return { message: 'Installed Codex CLI is signed in and ready.', status: 'connected' }
  } catch {
    return { message: 'Codex CLI is missing or not signed in on this machine.', status: 'error' }
  }
}

async function verifyOllama(endpoint: string, signal?: AbortSignal): Promise<ProviderConnectionResult> {
  try {
    const response = await request(`${trimEndpoint(endpoint)}/api/tags`, {}, signal)
    if (!response.ok) return { message: `Ollama returned HTTP ${response.status}.`, status: 'error' }
    const data = await response.json() as { models?: { name?: string }[] }
    return { message: 'Ollama service is reachable.', models: (data.models ?? []).flatMap((model) => model.name ? [model.name] : []), status: 'connected' }
  } catch {
    return { message: 'Ollama is not reachable. Check the Docker container or local service and endpoint.', status: 'error' }
  }
}

async function verifyAgentCrewOllama(apiUrl: string, requestedModel: string | undefined, token: string, signal?: AbortSignal): Promise<ProviderConnectionResult> {
  try {
    const response = await request(`${trimEndpoint(apiUrl)}/api/v1/agentcrew/status`, { Authorization: `Bearer ${token}` }, signal)
    if (!response.ok) {
      if (response.status === 401) {
        return { message: 'AgentCrew returned HTTP 401 (Unauthorized). Check AGENTCREW_TOKEN in .app.env or the access token in settings.', status: 'error' }
      }
      return { message: `AgentCrew returned HTTP ${response.status}.`, status: 'error' }
    }
    const status = await response.json() as { embeddingsReady?: boolean; model?: string; modelReady?: boolean; models?: string[]; ollama?: boolean }
    if (!status.ollama) return { message: 'AgentCrew cannot reach its Ollama Docker service.', status: 'error' }
    const model = requestedModel?.trim() || status.model
    const availableModels = status.models ?? []
    const modelReady = model ? availableModels.includes(model) || (model === status.model && status.modelReady) : status.modelReady
    if (!modelReady) return { message: `Ollama is online, but model ${model ?? 'configured model'} is not installed.`, models: availableModels, status: 'error' }
    return { message: `AgentCrew is connected to Ollama Docker with ${model ?? 'the configured model'}.`, models: availableModels, status: 'connected' }
  } catch {
    return { message: 'AgentCrew is not reachable. Check the AgentCrew API and Ollama Docker stack.', status: 'error' }
  }
}

async function verifyGemini(endpoint: string, apiKey: string): Promise<ProviderConnectionResult> {
  try {
    const response = await request(`${trimEndpoint(endpoint)}/v1beta/models?key=${encodeURIComponent(apiKey)}`)
    if (!response.ok) return { message: `Gemini returned HTTP ${response.status}.`, status: 'error' }
    return { message: 'Gemini API key and endpoint are valid.', status: 'connected' }
  } catch {
    return { message: 'Gemini endpoint is not reachable.', status: 'error' }
  }
}

async function verifyOpenAiCompatible(providerId: Exclude<CodeloopProviderId, 'codex' | 'gemini' | 'ollama'>, endpoint: string, apiKey: string): Promise<ProviderConnectionResult> {
  try {
    const response = await request(`${trimEndpoint(endpoint)}/models`, { Authorization: `Bearer ${apiKey}`, 'x-api-key': providerId === 'anthropic' ? apiKey : undefined, 'anthropic-version': providerId === 'anthropic' ? '2023-06-01' : undefined })
    if (!response.ok) return { message: `${providerIdLabel(providerId)} returned HTTP ${response.status}.`, status: 'error' }
    return { message: `${providerIdLabel(providerId)} credentials and endpoint are valid.`, status: 'connected' }
  } catch {
    return { message: `${providerIdLabel(providerId)} endpoint is not reachable.`, status: 'error' }
  }
}

async function request(url: string, headers: Record<string, string | undefined> = {}, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  const safeHeaders: Record<string, string> = {}
  for (const [name, value] of Object.entries(headers)) if (value) safeHeaders[name] = value
  try {
    const requestSignal = signal ? AbortSignal.any([controller.signal, signal]) : controller.signal
    return await fetch(url, { headers: safeHeaders, signal: requestSignal })
  } finally {
    clearTimeout(timeout)
  }
}

function trimEndpoint(endpoint: string): string {
  return endpoint.replace(/\/+$/, '')
}

function providerIdLabel(providerId: string): string {
  return providerId === 'openrouter' ? 'OpenRouter' : providerId[0].toUpperCase() + providerId.slice(1)
}

function codexCommand(): string {
  if (process.env.CODELOOP_CODEX_COMMAND) return process.env.CODELOOP_CODEX_COMMAND
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const binDirectory = join(process.env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin')
    try {
      const installed = readdirSync(binDirectory).sort().reverse().map((version) => join(binDirectory, version, 'codex.exe')).find(existsSync)
      if (installed) return installed
    } catch {
      // Fall back to PATH.
    }
  }
  return process.platform === 'win32' ? 'codex' : join(homedir(), '.local', 'bin', 'codex')
}
