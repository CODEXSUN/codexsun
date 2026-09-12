import {
  codingWorkerAttemptListResponseSchema,
  codingWorkerAttemptSchema,
  codingWorkerHandoffRequestSchema,
  type CodingWorkerHandoffRequest,
} from '@codexsun/zetro-contracts'

const baseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? 'http://127.0.0.1:6050').replace(/\/$/, '')

export async function fetchCodingWorkerAttempts() {
  const response = await fetch(`${baseUrl}/api/zetro/v1/coding-workers`)
  return codingWorkerAttemptListResponseSchema.parse(
    await readJson(response, 'Could not load workers.'),
  ).attempts
}

export async function prepareCodingWorker(input: CodingWorkerHandoffRequest) {
  const body = codingWorkerHandoffRequestSchema.parse(input)
  const response = await fetch(`${baseUrl}/api/zetro/v1/coding-workers/prepare`, {
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  return codingWorkerAttemptSchema.parse(await readJson(response, 'Could not prepare the worker.'))
}

export async function approveCodingWorker(attemptId: string) {
  return postWorkerAction(attemptId, 'approve')
}

export async function rejectCodingWorker(attemptId: string) {
  return postWorkerAction(attemptId, 'reject')
}

export async function verifyCodingWorker(attemptId: string) {
  return postWorkerAction(attemptId, 'verify', undefined)
}

export async function startCodingWorker(attemptId: string) {
  return postWorkerAction(attemptId, 'start', {})
}

export async function stopCodingWorker(attemptId: string) {
  return postWorkerAction(attemptId, 'stop', {})
}

export async function archiveCodingWorker(attemptId: string) {
  return postWorkerAction(attemptId, 'archive')
}

export async function cleanupCodingWorker(attemptId: string) {
  return postWorkerAction(attemptId, 'cleanup')
}

export async function integrateCodingWorker(attemptId: string) {
  return postWorkerAction(attemptId, 'integrate')
}

async function postWorkerAction(
  attemptId: string,
  action: 'approve' | 'reject' | 'verify' | 'start' | 'stop' | 'archive' | 'cleanup' | 'integrate',
  body: { confirmed: true } | Record<string, never> | undefined = { confirmed: true },
) {
  const response = await fetch(`${baseUrl}/api/zetro/v1/coding-workers/${attemptId}/${action}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    method: 'POST',
  })
  return codingWorkerAttemptSchema.parse(
    await readJson(response, `Could not ${action} the worker.`),
  )
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
