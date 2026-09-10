import type { IdentityPortal } from '@codexsun/platform-contracts'
import type { IdentityCredential, IdentitySession, StoredIdentityUser } from './identity.types.js'
import type { StoredIdentityDevice } from '../device/domain/device.types.js'
import type { IdentitySecurityEventRecord } from '../security/domain/security.types.js'
import type { IdentityIdentifierType } from '../user/domain/user-identifier.js'
import type { IdentityRoleRecord } from '../role/domain/role.types.js'

export interface IdentityPasswordHasher {
  hash(password: string): Promise<string>
  verify(passwordHash: string, password: string): Promise<boolean>
  verifyUnknown(password: string): Promise<void>
}

export interface IdentityRepository {
  createSession(session: IdentitySession): Promise<void>
  createDevice(
    device: StoredIdentityDevice,
    trustNewDevice?: boolean,
  ): Promise<StoredIdentityDevice>
  createIdentifier(userId: string, type: IdentityIdentifierType, value: string): Promise<void>
  createSecurityEvent(event: IdentitySecurityEventRecord): Promise<void>
  createRole(role: IdentityRoleRecord): Promise<void>
  createUser(
    user: StoredIdentityUser,
    credential: IdentityCredential,
    identifiers?: readonly { type: IdentityIdentifierType; value: string }[],
  ): Promise<void>
  findCredential(userId: string): Promise<IdentityCredential | undefined>
  findSession(tokenHash: string, portal: IdentityPortal): Promise<IdentitySession | undefined>
  findDevice(userId: string, deviceId: string): Promise<StoredIdentityDevice | undefined>
  findUserByIdentifier(
    type: IdentityIdentifierType,
    value: string,
  ): Promise<StoredIdentityUser | undefined>
  findUserByEmail(email: string): Promise<StoredIdentityUser | undefined>
  findUserById(id: string): Promise<StoredIdentityUser | undefined>
  listPermissions(userId: string): Promise<readonly string[]>
  listRoles(portal?: IdentityPortal): Promise<readonly IdentityRoleRecord[]>
  listDevices(userId: string): Promise<readonly StoredIdentityDevice[]>
  listSecurityEvents(limit: number): Promise<readonly IdentitySecurityEventRecord[]>
  listUserRoleIds(userId: string): Promise<readonly string[]>
  listUsers(portal?: IdentityPortal): Promise<readonly StoredIdentityUser[]>
  revokeSession(tokenHash: string, portal: IdentityPortal): Promise<void>
  replaceRolePermissions(
    roleId: string,
    permissions: readonly string[],
    createId: () => string,
  ): Promise<void>
  replaceUserRoles(userId: string, roleIds: readonly string[]): Promise<void>
  updateSessionExpiry(id: string, expiresAt: Date): Promise<void>
  updateDeviceSeen(userId: string, deviceId: string, seenAt: Date): Promise<void>
  updateDeviceStatus(
    userId: string,
    deviceId: string,
    status: StoredIdentityDevice['status'],
    activatedBy: string,
    activatedAt: Date,
  ): Promise<void>
  updateUserStatus(userId: string, status: StoredIdentityUser['status']): Promise<void>
}
