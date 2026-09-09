import type { IdentityPortal } from '@codexsun/platform-contracts'
import type { IdentityCredential, IdentitySession, StoredIdentityUser } from './identity.types.js'

export interface IdentityPasswordHasher {
  hash(password: string): Promise<string>
  verify(passwordHash: string, password: string): Promise<boolean>
}

export interface IdentityRepository {
  createSession(session: IdentitySession): Promise<void>
  createUser(user: StoredIdentityUser, credential: IdentityCredential): Promise<void>
  findCredential(userId: string): Promise<IdentityCredential | undefined>
  findSession(tokenHash: string, portal: IdentityPortal): Promise<IdentitySession | undefined>
  findUserByEmail(email: string): Promise<StoredIdentityUser | undefined>
  findUserById(id: string): Promise<StoredIdentityUser | undefined>
  listPermissions(userId: string): Promise<readonly string[]>
  revokeSession(tokenHash: string, portal: IdentityPortal): Promise<void>
  updateSessionExpiry(id: string, expiresAt: Date): Promise<void>
}
