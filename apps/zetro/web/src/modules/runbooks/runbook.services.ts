import { runbookCreateRequestSchema, runbookListResponseSchema, runbookRunListResponseSchema, runbookRunSchema, runbookSchema, type RunbookCreateRequest } from '@codexsun/zetro-contracts'

const baseUrl = (import.meta.env.VITE_ZETRO_API_URL ?? 'http://127.0.0.1:6050').replace(/\/$/, '')
export async function fetchRunbooks() { return runbookListResponseSchema.parse(await read(`${baseUrl}/api/zetro/v1/runbooks`, 'Could not load runbooks.')).runbooks }
export async function fetchRunbookRuns() { return runbookRunListResponseSchema.parse(await read(`${baseUrl}/api/zetro/v1/runbook-runs`, 'Could not load runbook runs.')).runs }
export async function createRunbook(input: RunbookCreateRequest) { return runbookSchema.parse(await read(`${baseUrl}/api/zetro/v1/runbooks`, 'Could not create the runbook.', { body: JSON.stringify(runbookCreateRequestSchema.parse(input)), headers: { 'content-type': 'application/json' }, method: 'POST' })) }
export async function startRunbook(id: string) { return runbookRunSchema.parse(await read(`${baseUrl}/api/zetro/v1/runbooks/${id}/start`, 'Could not start the runbook.', { method: 'POST' })) }
export async function stopRunbookRun(id: string) { return runbookRunSchema.parse(await read(`${baseUrl}/api/zetro/v1/runbook-runs/${id}/stop`, 'Could not stop the runbook.', { method: 'POST' })) }
export async function setRunbookEnabled(id: string, enabled: boolean) { return runbookSchema.parse(await read(`${baseUrl}/api/zetro/v1/runbooks/${id}`, 'Could not update the runbook.', { body: JSON.stringify({ enabled }), headers: { 'content-type': 'application/json' }, method: 'PATCH' })) }
async function read(url: string, fallback: string, init?: RequestInit) { const response = await fetch(url, init); const body = await response.json().catch(() => undefined); if (!response.ok) throw new Error(body && typeof body === 'object' && typeof Reflect.get(body, 'error') === 'string' ? Reflect.get(body, 'error') : fallback); return body }
