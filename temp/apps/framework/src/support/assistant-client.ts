import {
  supportAssistantChatRequestPayloadSchema,
  supportAssistantChatResponseSchema,
  supportAssistantStatusResponseSchema,
} from '@shared/index'
import { environment } from '@framework-core/runtime/config/environment'
import { ApplicationError } from '@framework-core/runtime/errors/application-error'

async function requestAssistant<T>(path: string, init?: RequestInit) {
  if (!environment.runtime.supportAssistant.enabled) {
    throw new ApplicationError('Orekso support assistant is disabled.', {}, 503)
  }

  let response: Response
  try {
    response = await fetch(`${environment.runtime.supportAssistant.url}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch (error) {
    throw new ApplicationError('Orekso support assistant is not reachable.', {
      detail: error instanceof Error ? error.message : 'Unknown connection failure.',
    }, 503)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApplicationError(
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : 'Orekso support assistant request failed.',
      {
        statusCode: response.status,
      },
      response.status >= 500 ? 503 : response.status,
    )
  }

  return payload as T
}

export async function readSupportAssistantStatus() {
  if (!environment.runtime.supportAssistant.enabled) {
    return supportAssistantStatusResponseSchema.parse({
      assistant: {
        status: 'disabled',
        assistantName: 'Orekso',
        summary: 'The Orekso support assistant is disabled for this runtime.',
        codexsunUrl: null,
        indexedFiles: 0,
        indexedChunks: 0,
        inProgress: false,
        lastIndexedAt: null,
        lastError: null,
      },
    }).assistant
  }

  const response = await requestAssistant<unknown>('/status', {
    method: 'GET',
  })
  return supportAssistantStatusResponseSchema.parse(response).assistant
}

export async function askSupportAssistant(payload: unknown) {
  const parsedPayload = supportAssistantChatRequestPayloadSchema.parse(payload)
  const response = await requestAssistant<unknown>('/chat', {
    method: 'POST',
    body: JSON.stringify(parsedPayload),
  })

  return supportAssistantChatResponseSchema.parse(response)
}

export async function reindexSupportAssistant() {
  const response = await requestAssistant<unknown>('/index/build', {
    method: 'POST',
    body: JSON.stringify({}),
  })

  return supportAssistantStatusResponseSchema.parse(response).assistant
}
