import { z } from 'zod'
import { zetroFetch } from '../../lib/zetro-api'

export const sandboxResponseSchema = z.strictObject({
  sandbox: z.strictObject({
    state: z.enum([
      'unverified',
      'setting-up',
      'setup-ready',
      'verifying',
      'verified',
      'blocked',
      'unsupported',
    ]),
    message: z.string(),
    allowLocalNetwork: z.boolean(),
    checkedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    checks: z.array(z.strictObject({ name: z.string(), passed: z.boolean() })),
  }),
})
const url = `${(import.meta.env.VITE_ZETRO_API_URL ?? '').replace(/\/$/, '')}/api/v1/settings/codex/sandbox`

export async function readSandbox() {
  return parse(await zetroFetch(url, { signal: AbortSignal.timeout(15_000) }))
}
export async function updateSandbox(input: {
  action: 'setup' | 'verify'
  allowLocalNetwork: boolean
}) {
  return parse(
    await zetroFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, confirm: true }),
    }),
  )
}
async function parse(response: Response) {
  if (response.status === 404) {
    throw new Error(
      'This Zetro API does not provide security verification. Update or restart the matching API build, then retry.',
    )
  }
  const payload: unknown = await response.json()
  if (!response.ok)
    throw new Error(
      z.object({ error: z.string() }).safeParse(payload).data?.error ?? 'Sandbox request failed.',
    )
  return sandboxResponseSchema.parse(payload).sandbox
}
