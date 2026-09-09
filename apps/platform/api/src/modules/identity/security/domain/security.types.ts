import type { IdentityClientType } from '@codexsun/platform-contracts'

export type IdentitySecurityOutcome = 'allowed' | 'denied' | 'failed'
export type IdentitySecurityRisk = 'low' | 'medium' | 'high' | 'critical'

export interface IdentitySecurityEventRecord {
  actorUserId: string | null
  clientType: IdentityClientType | null
  createdAt: Date
  deviceId: string | null
  eventType: string
  id: string
  ipAddress: string | null
  outcome: IdentitySecurityOutcome
  path: string | null
  risk: IdentitySecurityRisk
  subjectUserId: string | null
  userAgent: string | null
}

export interface IdentityRequestEvidence {
  ipAddress?: string
  path?: string
  userAgent?: string
}
