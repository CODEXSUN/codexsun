import { z } from 'zod'

export const startupPolicyKey = 'zetro.settings.startup-verification.v1'
const policySchema = z.strictObject({ enabled: z.literal(true), allowLocalNetwork: z.boolean() })
export type StartupPolicy = z.infer<typeof policySchema>

export function readStartupPolicy(storage: Pick<Storage, 'getItem'>): StartupPolicy | null {
  try {
    return (
      policySchema.safeParse(JSON.parse(storage.getItem(startupPolicyKey) ?? 'null')).data ?? null
    )
  } catch {
    return null
  }
}

export function saveStartupPolicy(storage: Pick<Storage, 'setItem'>, allowLocalNetwork: boolean) {
  storage.setItem(startupPolicyKey, JSON.stringify({ enabled: true, allowLocalNetwork }))
}

export function hasCurrentEvidence(
  status: { state: string; expiresAt: string | null },
  now = Date.now(),
) {
  return (
    status.state === 'verified' && status.expiresAt !== null && Date.parse(status.expiresAt) > now
  )
}
