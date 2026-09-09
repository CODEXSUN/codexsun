import type { IdentityClientType, IdentityDeviceStatus } from '@codexsun/platform-contracts'

export interface StoredIdentityDevice {
  activatedAt: Date | null
  activatedBy: string | null
  clientType: IdentityClientType
  deviceId: string
  deviceName: string
  firstSeenAt: Date
  lastSeenAt: Date
  status: IdentityDeviceStatus
  tokenHash: string
  userId: string
}
