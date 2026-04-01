import type {
  ActorType,
  AuthOtpChannel,
  AuthPermission,
  AuthRole,
  AuthUser,
  PermissionKey,
  RoleKey,
} from '@shared/index'
import type { RowDataPacket } from 'mysql2'
import { randomUUID } from 'node:crypto'
import { isSuperAdminEmail } from '@framework-core/runtime/config/environment'
import { ensureDatabaseSchema } from '@framework-core/runtime/database/database'
import { db } from '@framework-core/runtime/database/orm'
import { authTableNames, productTableNames } from '@framework-core/runtime/database/table-names'

interface UserRow extends RowDataPacket {
  id: string
  email: string
  phone_number: string | null
  display_name: string
  avatar_url: string | null
  actor_type: ActorType
  password_hash: string
  organization_name: string | null
  is_active: number
  deletion_requested_at: Date | null
  purge_after_at: Date | null
  created_at: Date
  updated_at: Date
}

interface RoleRow extends RowDataPacket {
  role_key: RoleKey
  role_name: string
  role_summary: string
  role_actor_type: ActorType
  permission_key: PermissionKey | null
  permission_name: string | null
  permission_summary: string | null
}

interface ContactVerificationRow extends RowDataPacket {
  id: string
  purpose: string
  actor_type: ActorType
  channel: AuthOtpChannel
  destination: string
  otp_hash: string
  expires_at: Date
  verified_at: Date | null
  consumed_at: Date | null
  attempts_count: number
  is_active: number
  created_at: Date
  updated_at: Date
}

export interface StoredAuthUser {
  user: AuthUser
  passwordHash: string
  deletionRequestedAt: string | null
  purgeAfterAt: string | null
}

export interface StoredContactVerification {
  id: string
  purpose: string
  actorType: ActorType
  channel: AuthOtpChannel
  destination: string
  otpHash: string
  expiresAt: string
  verifiedAt: string | null
  consumedAt: string | null
  attemptsCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export class AuthUserRepository {
  async findByEmail(email: string) {
    await ensureDatabaseSchema()

    const userRows = await db.query<UserRow>(
      `
        SELECT
          id,
          email,
          phone_number,
          display_name,
          avatar_url,
          actor_type,
          password_hash,
          organization_name,
          is_active,
          deletion_requested_at,
          purge_after_at,
          created_at,
          updated_at
        FROM ${authTableNames.users}
        WHERE email = ?
      `,
      [email],
    )

    return Promise.all(userRows.map((userRow) => this.toStoredAuthUser(userRow)))
  }

  async findByEmailAndActorType(email: string, actorType: ActorType) {
    await ensureDatabaseSchema()

    const userRows = await db.query<UserRow>(
      `
        SELECT
          id,
          email,
          phone_number,
          display_name,
          avatar_url,
          actor_type,
          password_hash,
          organization_name,
          is_active,
          deletion_requested_at,
          purge_after_at,
          created_at,
          updated_at
        FROM ${authTableNames.users}
        WHERE email = ? AND actor_type = ?
        LIMIT 1
      `,
      [email, actorType],
    )

    const userRow = userRows[0]
    if (!userRow) {
      return null
    }

    const [storedUser] = await this.findByEmail(userRow.email)
    return storedUser ?? null
  }

  async findById(id: string) {
    await ensureDatabaseSchema()

    const userRows = await db.query<UserRow>(
      `
        SELECT
          id,
          email,
          phone_number,
          display_name,
          avatar_url,
          actor_type,
          password_hash,
          organization_name,
          is_active,
          deletion_requested_at,
          purge_after_at,
          created_at,
          updated_at
        FROM ${authTableNames.users}
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

    const userRow = userRows[0]
    if (!userRow) {
      return null
    }

    return this.toStoredAuthUser(userRow)
  }

  async findByPhoneNumber(phoneNumber: string) {
    await ensureDatabaseSchema()

    const userRows = await db.query<UserRow>(
      `
        SELECT
          id,
          email,
          phone_number,
          display_name,
          avatar_url,
          actor_type,
          password_hash,
          organization_name,
          is_active,
          deletion_requested_at,
          purge_after_at,
          created_at,
          updated_at
        FROM ${authTableNames.users}
        WHERE phone_number = ?
      `,
      [phoneNumber],
    )

    return Promise.all(userRows.map((userRow) => this.toStoredAuthUser(userRow)))
  }

  async list() {
    await ensureDatabaseSchema()

    const userRows = await db.query<UserRow>(
      `
        SELECT
          id,
          email,
          phone_number,
          display_name,
          avatar_url,
          actor_type,
          password_hash,
          organization_name,
          is_active,
          deletion_requested_at,
          purge_after_at,
          created_at,
          updated_at
        FROM ${authTableNames.users}
        ORDER BY created_at DESC, email ASC
      `,
    )

    const storedUsers = await Promise.all(userRows.map((userRow) => this.toStoredAuthUser(userRow)))
    return storedUsers.map((entry) => entry.user)
  }

  async create(input: {
    email: string
    phoneNumber: string | null
    displayName: string
    actorType: ActorType
    avatarUrl: string | null
    passwordHash: string
    organizationName: string | null
  }) {
    await ensureDatabaseSchema()

    const id = randomUUID()
    const roleKey = this.getDefaultRoleKey(input.actorType)

    await db.execute(
      `
        INSERT INTO ${authTableNames.users} (
          id,
          email,
          phone_number,
          display_name,
          avatar_url,
          actor_type,
          password_hash,
          organization_name
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        input.email,
        input.phoneNumber,
        input.displayName,
        input.avatarUrl,
        input.actorType,
        input.passwordHash,
        input.organizationName,
      ],
    )

    await this.assignDefaultRole(id, roleKey)

    const storedUser = await this.findByEmailAndActorType(input.email, input.actorType)
    if (!storedUser) {
      throw new Error('Expected newly created user to be retrievable.')
    }

    return storedUser.user
  }

  async update(input: {
    id: string
    email: string
    phoneNumber: string | null
    displayName: string
    actorType: ActorType
    avatarUrl: string | null
    organizationName: string | null
    isActive: boolean
    passwordHash?: string | null
  }) {
    await ensureDatabaseSchema()

    if (input.passwordHash) {
      await db.execute(
        `
          UPDATE ${authTableNames.users}
          SET email = ?,
              phone_number = ?,
              display_name = ?,
              avatar_url = ?,
              actor_type = ?,
              password_hash = ?,
              organization_name = ?,
              is_active = ?
          WHERE id = ?
        `,
        [
          input.email,
          input.phoneNumber,
          input.displayName,
          input.avatarUrl,
          input.actorType,
          input.passwordHash,
          input.organizationName,
          input.isActive ? 1 : 0,
          input.id,
        ],
      )
    } else {
      await db.execute(
        `
          UPDATE ${authTableNames.users}
          SET email = ?,
              phone_number = ?,
              display_name = ?,
              avatar_url = ?,
              actor_type = ?,
              organization_name = ?,
              is_active = ?
          WHERE id = ?
        `,
        [
          input.email,
          input.phoneNumber,
          input.displayName,
          input.avatarUrl,
          input.actorType,
          input.organizationName,
          input.isActive ? 1 : 0,
          input.id,
        ],
      )
    }

    await this.assignDefaultRole(input.id, this.getDefaultRoleKey(input.actorType))

    const storedUser = await this.findById(input.id)
    if (!storedUser) {
      throw new Error('Expected updated user to be retrievable.')
    }

    return storedUser.user
  }

  async deactivatePendingContactVerifications(input: {
    purpose: string
    actorType: ActorType
    channel: AuthOtpChannel
    destination: string
  }) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${authTableNames.contactVerifications}
        SET is_active = 0
        WHERE purpose = ?
          AND actor_type = ?
          AND channel = ?
          AND destination = ?
          AND consumed_at IS NULL
      `,
      [input.purpose, input.actorType, input.channel, input.destination],
    )
  }

  async createContactVerification(input: {
    purpose: string
    actorType: ActorType
    channel: AuthOtpChannel
    destination: string
    otpHash: string
    expiresAt: Date
  }) {
    await ensureDatabaseSchema()

    const id = randomUUID()
    await db.execute(
      `
        INSERT INTO ${authTableNames.contactVerifications} (
          id,
          purpose,
          actor_type,
          channel,
          destination,
          otp_hash,
          expires_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [id, input.purpose, input.actorType, input.channel, input.destination, input.otpHash, input.expiresAt],
    )

    const verification = await this.getContactVerification(id)
    if (!verification) {
      throw new Error('Expected verification challenge to be retrievable.')
    }

    return verification
  }

  async getContactVerification(id: string) {
    await ensureDatabaseSchema()

    const rows = await db.query<ContactVerificationRow>(
      `
        SELECT
          id,
          purpose,
          actor_type,
          channel,
          destination,
          otp_hash,
          expires_at,
          verified_at,
          consumed_at,
          attempts_count,
          is_active,
          created_at,
          updated_at
        FROM ${authTableNames.contactVerifications}
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    )

    const row = rows[0]
    if (!row) {
      return null
    }

    return {
      id: row.id,
      purpose: row.purpose,
      actorType: row.actor_type,
      channel: row.channel,
      destination: row.destination,
      otpHash: row.otp_hash,
      expiresAt: row.expires_at.toISOString(),
      verifiedAt: row.verified_at?.toISOString() ?? null,
      consumedAt: row.consumed_at?.toISOString() ?? null,
      attemptsCount: row.attempts_count,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    } satisfies StoredContactVerification
  }

  async incrementContactVerificationAttempts(id: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${authTableNames.contactVerifications}
        SET attempts_count = attempts_count + 1
        WHERE id = ?
      `,
      [id],
    )
  }

  async markContactVerificationVerified(id: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${authTableNames.contactVerifications}
        SET verified_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [id],
    )
  }

  async consumeContactVerification(id: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${authTableNames.contactVerifications}
        SET consumed_at = CURRENT_TIMESTAMP, is_active = 0
        WHERE id = ?
      `,
      [id],
    )
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${authTableNames.users}
        SET password_hash = ?
        WHERE id = ?
      `,
      [passwordHash, userId],
    )
  }

  async deactivateUser(userId: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${authTableNames.users}
        SET is_active = 0
        WHERE id = ?
      `,
      [userId],
    )
  }

  async scheduleCustomerDeletion(userId: string, purgeAfter: Date) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${authTableNames.users}
        SET is_active = 0,
            deletion_requested_at = CURRENT_TIMESTAMP,
            purge_after_at = ?
        WHERE id = ?
      `,
      [purgeAfter, userId],
    )
  }

  async reactivateUser(userId: string) {
    await ensureDatabaseSchema()

    await db.execute(
      `
        UPDATE ${authTableNames.users}
        SET is_active = 1,
            deletion_requested_at = NULL,
            purge_after_at = NULL
        WHERE id = ?
      `,
      [userId],
    )
  }

  async purgeCustomerAccount(userId: string) {
    await ensureDatabaseSchema()

    const storedUser = await this.findById(userId)
    if (!storedUser) {
      return
    }

    await db.transaction(async (transaction) => {
      await transaction.execute(
        `
          DELETE FROM ${authTableNames.contactVerifications}
          WHERE actor_type = 'customer'
            AND destination IN (?, ?)
        `,
        [storedUser.user.email, storedUser.user.phoneNumber ?? ''],
      )

      await transaction.execute(
        `
          UPDATE ${productTableNames.reviews}
          SET user_id = NULL
          WHERE user_id = ?
        `,
        [userId],
      )

      await transaction.execute(
        `
          DELETE FROM ${authTableNames.users}
          WHERE id = ?
        `,
        [userId],
      )
    })
  }

  private async getUserRolesAndPermissions(userId: string) {
    const rows = await db.query<RoleRow>(
      `
        SELECT
          r.role_key,
          r.name AS role_name,
          r.summary AS role_summary,
          r.actor_type AS role_actor_type,
          p.permission_key,
          p.name AS permission_name,
          p.summary AS permission_summary
        FROM ${authTableNames.userRoles} ur
        INNER JOIN ${authTableNames.roles} r
          ON r.id = ur.role_id
          AND r.is_active = 1
        LEFT JOIN ${authTableNames.rolePermissions} rp
          ON rp.role_id = r.id
          AND rp.is_active = 1
        LEFT JOIN ${authTableNames.permissions} p
          ON p.id = rp.permission_id
          AND p.is_active = 1
        WHERE ur.user_id = ?
          AND ur.is_active = 1
      `,
      [userId],
    )

    const permissionsByKey = new Map<PermissionKey, AuthPermission>()
    const rolesByKey = new Map<RoleKey, AuthRole>()

    for (const row of rows) {
      let role = rolesByKey.get(row.role_key)
      if (!role) {
        role = {
          key: row.role_key,
          name: row.role_name,
          summary: row.role_summary,
          actorType: row.role_actor_type,
          permissions: [],
        }
        rolesByKey.set(row.role_key, role)
      }

      if (row.permission_key && row.permission_name && row.permission_summary) {
        const permission = {
          key: row.permission_key,
          name: row.permission_name,
          summary: row.permission_summary,
        } satisfies AuthPermission

        if (!permissionsByKey.has(row.permission_key)) {
          permissionsByKey.set(row.permission_key, permission)
        }

        if (!role.permissions.some((entry) => entry.key === permission.key)) {
          role.permissions.push(permission)
        }
      }
    }

    return {
      roles: Array.from(rolesByKey.values()),
      permissions: Array.from(permissionsByKey.values()),
    }
  }

  private getDefaultRoleKey(actorType: ActorType): RoleKey {
    const roleKeyByActorType: Record<ActorType, RoleKey> = {
      admin: 'admin_owner',
      staff: 'staff_operator',
      customer: 'customer_portal',
      vendor: 'vendor_portal',
    }

    return roleKeyByActorType[actorType]
  }

  private async assignDefaultRole(userId: string, roleKey: RoleKey) {
    await db.execute(
      `
        UPDATE ${authTableNames.userRoles}
        SET is_active = 0
        WHERE user_id = ?
      `,
      [userId],
    )

    await db.execute(
      `
        INSERT INTO ${authTableNames.userRoles} (id, user_id, role_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          is_active = 1
      `,
      [`${userId}:${roleKey}`, userId, roleKey],
    )
  }

  private async toStoredAuthUser(userRow: UserRow) {
    const rolesAndPermissions = await this.getUserRolesAndPermissions(userRow.id)

    return {
      user: {
        id: userRow.id,
        email: userRow.email,
        phoneNumber: userRow.phone_number,
        displayName: userRow.display_name,
        isSuperAdmin: isSuperAdminEmail(userRow.email, userRow.actor_type),
        avatarUrl: userRow.avatar_url,
        actorType: userRow.actor_type,
        isActive: Boolean(userRow.is_active),
        organizationName: userRow.organization_name,
        roles: rolesAndPermissions.roles,
        permissions: rolesAndPermissions.permissions,
        createdAt: userRow.created_at.toISOString(),
        updatedAt: userRow.updated_at.toISOString(),
      },
      passwordHash: userRow.password_hash,
      deletionRequestedAt: userRow.deletion_requested_at?.toISOString() ?? null,
      purgeAfterAt: userRow.purge_after_at?.toISOString() ?? null,
    } satisfies StoredAuthUser
  }
}
