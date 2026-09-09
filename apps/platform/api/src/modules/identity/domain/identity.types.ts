import type { IdentityPortal, IdentityUser } from '@codexsun/platform-contracts'

export interface IdentityCredential {
  passwordHash: string
  userId: string
}

export interface IdentitySession {
  createdAt: Date
  expiresAt: Date
  id: string
  portal: IdentityPortal
  tokenHash: string
  userId: string
}

export interface StoredIdentityUser extends IdentityUser {
  status: 'active' | 'disabled'
}

export interface IdentityLoginResult {
  expiresAt: Date
  token: string
  user: IdentityUser
}

export interface IdentitySessionResult {
  expiresAt: Date
  user: IdentityUser
}
