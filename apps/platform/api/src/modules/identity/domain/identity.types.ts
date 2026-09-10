import type { IdentityDevice, IdentityPortal, IdentityUser } from '@codexsun/platform-contracts'
import type { StoredIdentityDevice } from '../device/domain/device.types.js'

export interface IdentityCredential {
  passwordHash: string
  userId: string
}

export interface IdentitySession {
  authVersion?: number
  createdAt: Date
  expiresAt: Date
  id: string
  deviceId: string
  portal: IdentityPortal
  tokenHash: string
  userId: string
}

export interface StoredIdentityUser extends IdentityUser {
  authVersion?: number
  status: 'active' | 'disabled'
}

export interface IdentityLoginResult {
  accessToken?: string
  device: IdentityDevice
  deviceToken?: string
  expiresAt: Date
  token: string
  user: IdentityUser
}

export interface IdentitySessionResult {
  device: IdentityDevice
  sessionId: string
  expiresAt: Date
  user: IdentityUser
}

export interface IdentityDeviceDecision {
  device: StoredIdentityDevice
  deviceToken?: string
}
