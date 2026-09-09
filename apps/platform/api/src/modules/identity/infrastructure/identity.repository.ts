import type { IdentityPortal } from '@codexsun/platform-contracts'
import type { Database } from '../../../database.js'
import type { IdentityRepository } from '../domain/identity.ports.js'
import type {
  IdentityCredential,
  IdentitySession,
  StoredIdentityUser,
} from '../domain/identity.types.js'
import type { StoredIdentityDevice } from '../device/domain/device.types.js'
import type { IdentitySecurityEventRecord } from '../security/domain/security.types.js'
import type { IdentityIdentifierType } from '../user/domain/user-identifier.js'
import type { IdentityRoleRecord } from '../role/domain/role.types.js'

export class MariaDbIdentityRepository implements IdentityRepository {
  constructor(private readonly database: Database) {}

  async createDevice(device: StoredIdentityDevice): Promise<void> {
    await this.database.insertInto('identity_devices').values(toDeviceRow(device)).execute()
  }

  async createIdentifier(
    userId: string,
    type: IdentityIdentifierType,
    value: string,
  ): Promise<void> {
    const now = new Date()
    await this.database
      .insertInto('identity_user_identifiers')
      .values({
        created_at: now,
        id: crypto.randomUUID(),
        identifier_type: type,
        identifier_value: value,
        user_id: userId,
        verified_at: type === 'email' ? now : null,
      })
      .execute()
  }

  async createSecurityEvent(event: IdentitySecurityEventRecord): Promise<void> {
    await this.database
      .insertInto('identity_security_events')
      .values({
        actor_user_id: event.actorUserId,
        client_type: event.clientType,
        created_at: event.createdAt,
        device_id: event.deviceId,
        event_type: event.eventType,
        id: event.id,
        ip_address: event.ipAddress,
        outcome: event.outcome,
        path: event.path,
        risk: event.risk,
        subject_user_id: event.subjectUserId,
        user_agent: event.userAgent,
      })
      .execute()
  }

  async createRole(role: IdentityRoleRecord): Promise<void> {
    await this.database
      .insertInto('identity_roles')
      .values({ id: role.id, name: role.name, portal: role.portal })
      .execute()
    await this.replaceRolePermissions(role.id, role.permissions, crypto.randomUUID)
  }

  async createSession(session: IdentitySession): Promise<void> {
    await this.database
      .insertInto('identity_sessions')
      .values({
        created_at: session.createdAt,
        device_id: session.deviceId,
        expires_at: session.expiresAt,
        id: session.id,
        portal: session.portal,
        revoked_at: null,
        token_hash: session.tokenHash,
        user_id: session.userId,
      })
      .execute()
  }

  async createUser(user: StoredIdentityUser, credential: IdentityCredential): Promise<void> {
    await this.database.transaction().execute(async (transaction) => {
      const now = new Date()
      await transaction
        .insertInto('identity_users')
        .values({
          created_at: now,
          display_name: user.displayName,
          email: user.email,
          id: user.id,
          portal: user.portal,
          status: user.status,
          updated_at: now,
        })
        .execute()
      await transaction
        .insertInto('identity_user_identifiers')
        .values({
          created_at: now,
          id: crypto.randomUUID(),
          identifier_type: 'email',
          identifier_value: user.email,
          user_id: user.id,
          verified_at: now,
        })
        .execute()
      await transaction
        .insertInto('identity_credentials')
        .values({ password_hash: credential.passwordHash, updated_at: now, user_id: user.id })
        .execute()
    })
  }

  async findCredential(userId: string): Promise<IdentityCredential | undefined> {
    const row = await this.database
      .selectFrom('identity_credentials')
      .select(['password_hash', 'user_id'])
      .where('user_id', '=', userId)
      .executeTakeFirst()
    return row ? { passwordHash: row.password_hash, userId: row.user_id } : undefined
  }

  async findSession(
    tokenHash: string,
    portal: IdentityPortal,
  ): Promise<IdentitySession | undefined> {
    const row = await this.database
      .selectFrom('identity_sessions')
      .selectAll()
      .where('token_hash', '=', tokenHash)
      .where('portal', '=', portal)
      .where('revoked_at', 'is', null)
      .executeTakeFirst()
    return row
      ? {
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          deviceId: row.device_id,
          id: row.id,
          portal: row.portal as IdentityPortal,
          tokenHash: row.token_hash,
          userId: row.user_id,
        }
      : undefined
  }

  findUserByEmail(email: string): Promise<StoredIdentityUser | undefined> {
    return this.findUser('email', email)
  }

  async findUserByIdentifier(
    type: IdentityIdentifierType,
    value: string,
  ): Promise<StoredIdentityUser | undefined> {
    const row = await this.database
      .selectFrom('identity_user_identifiers as identifiers')
      .innerJoin('identity_users as users', 'users.id', 'identifiers.user_id')
      .select(['users.display_name', 'users.email', 'users.id', 'users.portal', 'users.status'])
      .where('identifiers.identifier_type', '=', type)
      .where('identifiers.identifier_value', '=', value)
      .executeTakeFirst()
    return row ? toStoredUser(row) : undefined
  }

  async findDevice(userId: string, deviceId: string): Promise<StoredIdentityDevice | undefined> {
    const row = await this.database
      .selectFrom('identity_devices')
      .selectAll()
      .where('user_id', '=', userId)
      .where('device_id', '=', deviceId)
      .executeTakeFirst()
    return row ? toDevice(row) : undefined
  }

  findUserById(id: string): Promise<StoredIdentityUser | undefined> {
    return this.findUser('id', id)
  }

  async listPermissions(userId: string): Promise<readonly string[]> {
    const rows = await this.database
      .selectFrom('identity_user_roles as users')
      .innerJoin('identity_role_permissions as roles', 'roles.role_id', 'users.role_id')
      .innerJoin('identity_permissions as permissions', 'permissions.id', 'roles.permission_id')
      .select('permissions.name')
      .where('users.user_id', '=', userId)
      .execute()
    return rows.map(({ name }) => name)
  }

  async listRoles(portal?: IdentityPortal): Promise<readonly IdentityRoleRecord[]> {
    let query = this.database
      .selectFrom('identity_roles as roles')
      .leftJoin('identity_role_permissions as links', 'links.role_id', 'roles.id')
      .leftJoin('identity_permissions as permissions', 'permissions.id', 'links.permission_id')
      .select(['roles.id', 'roles.name', 'roles.portal', 'permissions.name as permission'])
      .orderBy('roles.name')
    if (portal) query = query.where('roles.portal', '=', portal)
    const roles = new Map<string, IdentityRoleRecord>()
    for (const row of await query.execute()) {
      const role = roles.get(row.id) ?? {
        id: row.id,
        name: row.name,
        permissions: [],
        portal: row.portal as IdentityPortal,
      }
      if (row.permission) (role.permissions as string[]).push(row.permission)
      roles.set(row.id, role)
    }
    return [...roles.values()]
  }

  async listDevices(userId: string): Promise<readonly StoredIdentityDevice[]> {
    const rows = await this.database
      .selectFrom('identity_devices')
      .selectAll()
      .where('user_id', '=', userId)
      .orderBy('last_seen_at', 'desc')
      .execute()
    return rows.map(toDevice)
  }

  async listSecurityEvents(limit: number): Promise<readonly IdentitySecurityEventRecord[]> {
    const rows = await this.database
      .selectFrom('identity_security_events')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .execute()
    return rows.map((row) => ({
      actorUserId: row.actor_user_id,
      clientType: row.client_type as IdentitySecurityEventRecord['clientType'],
      createdAt: row.created_at,
      deviceId: row.device_id,
      eventType: row.event_type,
      id: row.id,
      ipAddress: row.ip_address,
      outcome: row.outcome as IdentitySecurityEventRecord['outcome'],
      path: row.path,
      risk: row.risk as IdentitySecurityEventRecord['risk'],
      subjectUserId: row.subject_user_id,
      userAgent: row.user_agent,
    }))
  }

  async listUserRoleIds(userId: string): Promise<readonly string[]> {
    const rows = await this.database
      .selectFrom('identity_user_roles')
      .select('role_id')
      .where('user_id', '=', userId)
      .execute()
    return rows.map(({ role_id }) => role_id)
  }

  async listUsers(portal?: IdentityPortal): Promise<readonly StoredIdentityUser[]> {
    let query = this.database
      .selectFrom('identity_users')
      .select(['display_name', 'email', 'id', 'portal', 'status'])
      .orderBy('display_name')
    if (portal) query = query.where('portal', '=', portal)
    return (await query.execute()).map(toStoredUser)
  }

  async revokeSession(tokenHash: string, portal: IdentityPortal): Promise<void> {
    await this.database
      .updateTable('identity_sessions')
      .set({ revoked_at: new Date() })
      .where('token_hash', '=', tokenHash)
      .where('portal', '=', portal)
      .execute()
  }

  async replaceRolePermissions(
    roleId: string,
    permissions: readonly string[],
    createId: () => string,
  ): Promise<void> {
    await this.database.transaction().execute(async (transaction) => {
      await transaction
        .deleteFrom('identity_role_permissions')
        .where('role_id', '=', roleId)
        .execute()
      for (const name of [...new Set(permissions)]) {
        await transaction
          .insertInto('identity_permissions')
          .values({ id: createId(), name })
          .onDuplicateKeyUpdate({ name })
          .execute()
        const permission = await transaction
          .selectFrom('identity_permissions')
          .select('id')
          .where('name', '=', name)
          .executeTakeFirstOrThrow()
        await transaction
          .insertInto('identity_role_permissions')
          .values({ permission_id: permission.id, role_id: roleId })
          .execute()
      }
    })
  }

  async replaceUserRoles(userId: string, roleIds: readonly string[]): Promise<void> {
    await this.database.transaction().execute(async (transaction) => {
      await transaction.deleteFrom('identity_user_roles').where('user_id', '=', userId).execute()
      if (roleIds.length > 0) {
        await transaction
          .insertInto('identity_user_roles')
          .values([...new Set(roleIds)].map((roleId) => ({ role_id: roleId, user_id: userId })))
          .execute()
      }
    })
  }

  async updateSessionExpiry(id: string, expiresAt: Date): Promise<void> {
    await this.database
      .updateTable('identity_sessions')
      .set({ expires_at: expiresAt })
      .where('id', '=', id)
      .where('revoked_at', 'is', null)
      .execute()
  }

  async updateDeviceSeen(userId: string, deviceId: string, seenAt: Date): Promise<void> {
    await this.database
      .updateTable('identity_devices')
      .set({ last_seen_at: seenAt })
      .where('user_id', '=', userId)
      .where('device_id', '=', deviceId)
      .execute()
  }

  async updateDeviceStatus(
    userId: string,
    deviceId: string,
    status: StoredIdentityDevice['status'],
    activatedBy: string,
    activatedAt: Date,
  ): Promise<void> {
    await this.database
      .updateTable('identity_devices')
      .set({ activated_at: activatedAt, activated_by: activatedBy, status })
      .where('user_id', '=', userId)
      .where('device_id', '=', deviceId)
      .execute()
  }

  async updateUserStatus(userId: string, status: StoredIdentityUser['status']): Promise<void> {
    await this.database
      .updateTable('identity_users')
      .set({ status, updated_at: new Date() })
      .where('id', '=', userId)
      .execute()
  }

  private async findUser(field: 'email' | 'id', value: string) {
    const row = await this.database
      .selectFrom('identity_users')
      .select(['display_name', 'email', 'id', 'portal', 'status'])
      .where(field, '=', value)
      .executeTakeFirst()
    return row ? toStoredUser(row) : undefined
  }
}

function toStoredUser(row: {
  display_name: string
  email: string
  id: string
  portal: string
  status: string
}): StoredIdentityUser {
  return {
    displayName: row.display_name,
    email: row.email,
    id: row.id,
    portal: row.portal as IdentityPortal,
    status: row.status as StoredIdentityUser['status'],
  }
}

function toDevice(row: {
  activated_at: Date | null
  activated_by: string | null
  client_type: string
  device_id: string
  device_name: string
  first_seen_at: Date
  last_seen_at: Date
  status: string
  token_hash: string
  user_id: string
}): StoredIdentityDevice {
  return {
    activatedAt: row.activated_at,
    activatedBy: row.activated_by,
    clientType: row.client_type as StoredIdentityDevice['clientType'],
    deviceId: row.device_id,
    deviceName: row.device_name,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    status: row.status as StoredIdentityDevice['status'],
    tokenHash: row.token_hash,
    userId: row.user_id,
  }
}

function toDeviceRow(device: StoredIdentityDevice) {
  return {
    activated_at: device.activatedAt,
    activated_by: device.activatedBy,
    client_type: device.clientType,
    device_id: device.deviceId,
    device_name: device.deviceName,
    first_seen_at: device.firstSeenAt,
    last_seen_at: device.lastSeenAt,
    status: device.status,
    token_hash: device.tokenHash,
    user_id: device.userId,
  }
}
