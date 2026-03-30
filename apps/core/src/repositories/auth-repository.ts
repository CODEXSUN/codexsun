import type { Kysely } from "kysely"

import type {
  ActorType,
  AuthPermission,
  AuthRole,
  AuthSession,
  AuthUser,
} from "../../shared/index.js"

import { asQueryDatabase } from "../data/query-database.js"

import { coreTableNames } from "../../database/table-names.js"

type StoredAuthUser = {
  user: AuthUser
  passwordHash: string
}

type ContactVerificationRecord = {
  id: string
  purpose: string
  actorType: ActorType
  channel: "email" | "mobile"
  destination: string
  otpHash: string
  expiresAt: string
  verifiedAt: string | null
  consumedAt: string | null
  attemptedCount: number
  isActive: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

function asBoolean(value: unknown) {
  return Number(value ?? 0) === 1
}

function asString(value: unknown) {
  return String(value ?? "")
}

function asNullableString(value: unknown) {
  return value === null || value === undefined ? null : String(value)
}

function parseJsonRecord(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return null
  }
}

export class AuthRepository {
  constructor(private readonly database: Kysely<unknown>) {}

  async findByEmail(email: string) {
    return this.hydrateUsers(
      await asQueryDatabase(this.database)
        .selectFrom(coreTableNames.authUsers)
        .selectAll()
        .where("email", "=", email)
        .execute()
    )
  }

  async findById(id: string) {
    const [item] = await this.hydrateUsers(
      await asQueryDatabase(this.database)
        .selectFrom(coreTableNames.authUsers)
        .selectAll()
        .where("id", "=", id)
        .execute()
    )

    return item ?? null
  }

  async listUsers() {
    return this.hydrateUsers(
      await asQueryDatabase(this.database)
        .selectFrom(coreTableNames.authUsers)
        .selectAll()
        .orderBy("created_at")
        .execute()
    )
  }

  async listSessions() {
    const rows = await asQueryDatabase(this.database)
      .selectFrom(coreTableNames.authSessions)
      .selectAll()
      .orderBy("created_at desc")
      .execute()

    return rows.map((row) =>
      ({
        id: asString(row.id),
        userId: asString(row.user_id),
        actorType: asString(row.actor_type) as ActorType,
        createdAt: asString(row.created_at),
        updatedAt: asString(row.updated_at),
        expiresAt: asString(row.expires_at),
        revokedAt: asNullableString(row.revoked_at),
        lastSeenAt: asNullableString(row.last_seen_at),
        ipAddress: asNullableString(row.ip_address),
        userAgent: asNullableString(row.user_agent),
      }) satisfies AuthSession
    )
  }

  async create(input: {
    id: string
    email: string
    phoneNumber: string | null
    displayName: string
    actorType: ActorType
    avatarUrl: string | null
    passwordHash: string
    organizationName: string | null
    roleKey: string
    isSuperAdmin: boolean
  }) {
    const timestamp = new Date().toISOString()
    const queryDatabase = asQueryDatabase(this.database)

    await queryDatabase
      .insertInto(coreTableNames.authUsers)
      .values({
        id: input.id,
        email: input.email,
        phone_number: input.phoneNumber,
        display_name: input.displayName,
        actor_type: input.actorType,
        password_hash: input.passwordHash,
        avatar_url: input.avatarUrl,
        organization_name: input.organizationName,
        is_super_admin: input.isSuperAdmin ? 1 : 0,
        is_active: 1,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute()

    await queryDatabase
      .insertInto(coreTableNames.authUserRoles)
      .values({
        id: `${input.id}:${input.roleKey}`,
        user_id: input.id,
        role_id: input.roleKey,
        is_active: 1,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute()

    const stored = await this.findById(input.id)

    if (!stored) {
      throw new Error("Expected created auth user to be retrievable.")
    }

    return stored.user
  }

  async createSession(input: {
    id: string
    userId: string
    tokenId: string
    actorType: ActorType
    expiresAt: string
    ipAddress: string | null
    userAgent: string | null
  }) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .insertInto(coreTableNames.authSessions)
      .values({
        id: input.id,
        user_id: input.userId,
        token_id: input.tokenId,
        actor_type: input.actorType,
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
        expires_at: input.expiresAt,
        last_seen_at: timestamp,
        revoked_at: null,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute()
  }

  async findSessionById(id: string) {
    const row = await asQueryDatabase(this.database)
      .selectFrom(coreTableNames.authSessions)
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    if (!row) {
      return null
    }

    return {
      id: asString(row.id),
      userId: asString(row.user_id),
      tokenId: asString(row.token_id),
      actorType: asString(row.actor_type) as ActorType,
      ipAddress: asNullableString(row.ip_address),
      userAgent: asNullableString(row.user_agent),
      expiresAt: asString(row.expires_at),
      lastSeenAt: asNullableString(row.last_seen_at),
      revokedAt: asNullableString(row.revoked_at),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    }
  }

  async revokeSession(id: string) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .updateTable(coreTableNames.authSessions)
      .set({
        revoked_at: timestamp,
        updated_at: timestamp,
      })
      .where("id", "=", id)
      .execute()
  }

  async markSessionSeen(id: string) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .updateTable(coreTableNames.authSessions)
      .set({
        last_seen_at: timestamp,
        updated_at: timestamp,
      })
      .where("id", "=", id)
      .execute()
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    await asQueryDatabase(this.database)
      .updateTable(coreTableNames.authUsers)
      .set({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", userId)
      .execute()
  }

  async setUserActiveState(userId: string, isActive: boolean) {
    await asQueryDatabase(this.database)
      .updateTable(coreTableNames.authUsers)
      .set({
        is_active: isActive ? 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", userId)
      .execute()
  }

  async deactivatePendingContactVerifications(input: {
    purpose: string
    actorType: ActorType
    channel: "email" | "mobile"
    destination: string
  }) {
    await asQueryDatabase(this.database)
      .updateTable(coreTableNames.authContactVerifications)
      .set({
        is_active: 0,
        updated_at: new Date().toISOString(),
      })
      .where("purpose", "=", input.purpose)
      .where("actor_type", "=", input.actorType)
      .where("channel", "=", input.channel)
      .where("destination", "=", input.destination)
      .where("is_active", "=", 1)
      .execute()
  }

  async createContactVerification(input: {
    id: string
    purpose: string
    actorType: ActorType
    channel: "email" | "mobile"
    destination: string
    otpHash: string
    expiresAt: string
    metadata?: Record<string, unknown> | null
  }) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .insertInto(coreTableNames.authContactVerifications)
      .values({
        id: input.id,
        purpose: input.purpose,
        actor_type: input.actorType,
        channel: input.channel,
        destination: input.destination,
        otp_hash: input.otpHash,
        expires_at: input.expiresAt,
        verified_at: null,
        consumed_at: null,
        attempted_count: 0,
        is_active: 1,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute()

    return this.getContactVerification(input.id)
  }

  async getContactVerification(id: string) {
    const row = await asQueryDatabase(this.database)
      .selectFrom(coreTableNames.authContactVerifications)
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst()

    if (!row) {
      return null
    }

    return {
      id: asString(row.id),
      purpose: asString(row.purpose),
      actorType: asString(row.actor_type) as ActorType,
      channel: asString(row.channel) as "email" | "mobile",
      destination: asString(row.destination),
      otpHash: asString(row.otp_hash),
      expiresAt: asString(row.expires_at),
      verifiedAt: asNullableString(row.verified_at),
      consumedAt: asNullableString(row.consumed_at),
      attemptedCount: Number(row.attempted_count ?? 0),
      isActive: asBoolean(row.is_active),
      metadata: parseJsonRecord(row.metadata),
      createdAt: asString(row.created_at),
      updatedAt: asString(row.updated_at),
    } satisfies ContactVerificationRecord
  }

  async incrementContactVerificationAttempts(id: string) {
    const current = await this.getContactVerification(id)

    if (!current) {
      return
    }

    await asQueryDatabase(this.database)
      .updateTable(coreTableNames.authContactVerifications)
      .set({
        attempted_count: current.attemptedCount + 1,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .execute()
  }

  async markContactVerificationVerified(id: string) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .updateTable(coreTableNames.authContactVerifications)
      .set({
        verified_at: timestamp,
        updated_at: timestamp,
      })
      .where("id", "=", id)
      .execute()
  }

  async consumeContactVerification(id: string) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .updateTable(coreTableNames.authContactVerifications)
      .set({
        consumed_at: timestamp,
        is_active: 0,
        updated_at: timestamp,
      })
      .where("id", "=", id)
      .execute()
  }

  private async hydrateUsers(rows: ReadonlyArray<Record<string, unknown>>) {
    if (rows.length === 0) {
      return [] satisfies StoredAuthUser[]
    }

    const queryDatabase = asQueryDatabase(this.database)
    const userIds = rows.map((row) => asString(row.id))
    const roleRows = await queryDatabase
      .selectFrom(`${coreTableNames.authUserRoles} as ur`)
      .innerJoin(`${coreTableNames.authRoles} as r`, "ur.role_id", "r.id")
      .select([
        "ur.user_id as user_id",
        "r.id as role_id",
        "r.role_key as role_key",
        "r.name as name",
        "r.summary as summary",
        "r.actor_type as actor_type",
      ])
      .where("ur.user_id", "in", userIds)
      .where("ur.is_active", "=", 1)
      .where("r.is_active", "=", 1)
      .execute()
    const roleIds = Array.from(new Set(roleRows.map((row) => asString(row.role_id))))
    const permissionRows =
      roleIds.length === 0
        ? []
        : await queryDatabase
            .selectFrom(`${coreTableNames.authRolePermissions} as rp`)
            .innerJoin(
              `${coreTableNames.authPermissions} as p`,
              "rp.permission_id",
              "p.id"
            )
            .select([
              "rp.role_id as role_id",
              "p.permission_key as permission_key",
              "p.name as name",
              "p.summary as summary",
            ])
            .where("rp.role_id", "in", roleIds)
            .where("rp.is_active", "=", 1)
            .where("p.is_active", "=", 1)
            .execute()

    const permissionsByRole = new Map<string, AuthPermission[]>()

    for (const row of permissionRows) {
      const permission: AuthPermission = {
        key: asString(row.permission_key) as AuthPermission["key"],
        name: asString(row.name),
        summary: asString(row.summary),
      }
      const rolePermissions = permissionsByRole.get(asString(row.role_id)) ?? []
      rolePermissions.push(permission)
      permissionsByRole.set(asString(row.role_id), rolePermissions)
    }

    const rolesByUser = new Map<string, AuthRole[]>()

    for (const row of roleRows) {
      const roleId = asString(row.role_id)
      const role: AuthRole = {
        key: asString(row.role_key) as AuthRole["key"],
        name: asString(row.name),
        summary: asString(row.summary),
        actorType: asString(row.actor_type) as ActorType,
        permissions: permissionsByRole.get(roleId) ?? [],
      }
      const userRoles = rolesByUser.get(asString(row.user_id)) ?? []
      userRoles.push(role)
      rolesByUser.set(asString(row.user_id), userRoles)
    }

    return rows.map((row) => {
      const roles = rolesByUser.get(asString(row.id)) ?? []
      const permissions = Array.from(
        new Map(
          roles
            .flatMap((role) => role.permissions)
            .map((permission) => [permission.key, permission] as const)
        ).values()
      )

      return {
        user: {
          id: asString(row.id),
          email: asString(row.email),
          phoneNumber: asNullableString(row.phone_number),
          displayName: asString(row.display_name),
          actorType: asString(row.actor_type) as ActorType,
          isSuperAdmin: asBoolean(row.is_super_admin),
          avatarUrl: asNullableString(row.avatar_url),
          isActive: asBoolean(row.is_active),
          organizationName: asNullableString(row.organization_name),
          roles,
          permissions,
          createdAt: asString(row.created_at),
          updatedAt: asString(row.updated_at),
        } satisfies AuthUser,
        passwordHash: asString(row.password_hash),
      } satisfies StoredAuthUser
    })
  }
}

export type { ContactVerificationRecord, StoredAuthUser }
