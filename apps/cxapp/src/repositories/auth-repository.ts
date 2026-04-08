import type { Kysely } from "kysely"

import type {
  ActorType,
  AuthPermission,
  AuthRole,
  AuthRoleSummary,
  AuthSession,
  AuthUser,
} from "../../shared/index.js"

import { asQueryDatabase } from "../data/query-database.js"

import { cxappTableNames } from "../../database/table-names.js"

type StoredAuthUser = {
  user: AuthUser
  passwordHash: string
  failedLoginCount: number
  lastFailedLoginAt: string | null
  lockedUntil: string | null
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
        .selectFrom(cxappTableNames.authUsers)
        .selectAll()
        .where("email", "=", email)
        .execute()
    )
  }

  async findById(id: string) {
    const [item] = await this.hydrateUsers(
      await asQueryDatabase(this.database)
        .selectFrom(cxappTableNames.authUsers)
        .selectAll()
        .where("id", "=", id)
        .execute()
    )

    return item ?? null
  }

  async listUsers() {
    return this.hydrateUsers(
      await asQueryDatabase(this.database)
        .selectFrom(cxappTableNames.authUsers)
        .selectAll()
        .orderBy("created_at")
        .execute()
    )
  }

  async listRoles() {
    const queryDatabase = asQueryDatabase(this.database)
    const roleRows = await queryDatabase
      .selectFrom(cxappTableNames.authRoles)
      .selectAll()
      .orderBy("created_at")
      .execute()

    if (roleRows.length === 0) {
      return [] satisfies AuthRoleSummary[]
    }

    const roleIds = roleRows.map((row) => asString(row.id))
    const permissionRows = await queryDatabase
      .selectFrom(`${cxappTableNames.authRolePermissions} as rp`)
      .innerJoin(
        `${cxappTableNames.authPermissions} as p`,
        "rp.permission_id",
        "p.id"
      )
      .select([
        "rp.role_id as role_id",
        "p.permission_key as permission_key",
        "p.name as name",
        "p.summary as summary",
        "p.scope_type as scope_type",
        "p.app_id as app_id",
        "p.resource_key as resource_key",
        "p.action_key as action_key",
        "p.route as route",
        "p.is_active as is_active",
      ])
      .where("rp.role_id", "in", roleIds)
      .where("rp.is_active", "=", 1)
      .where("p.is_active", "=", 1)
      .execute()
    const assignedCounts = await queryDatabase
      .selectFrom(cxappTableNames.authUserRoles)
      .select([
        "role_id",
        ({ fn }) => fn.count<string>("id").as("assigned_count"),
      ])
      .where("role_id", "in", roleIds)
      .where("is_active", "=", 1)
      .groupBy("role_id")
      .execute()

    const permissionsByRole = new Map<string, AuthPermission[]>()

    for (const row of permissionRows) {
      const permission: AuthPermission = {
        key: asString(row.permission_key) as AuthPermission["key"],
        name: asString(row.name),
        summary: asString(row.summary),
        scopeType: asString(row.scope_type) as AuthPermission["scopeType"],
        appId: asNullableString(row.app_id),
        resourceKey: asString(row.resource_key),
        actionKey: asString(row.action_key),
        route: asNullableString(row.route),
        isActive: asBoolean(row.is_active),
      }
      const rolePermissions = permissionsByRole.get(asString(row.role_id)) ?? []
      rolePermissions.push(permission)
      permissionsByRole.set(asString(row.role_id), rolePermissions)
    }

    const countsByRole = new Map(
      assignedCounts.map((row) => [asString(row.role_id), Number(row.assigned_count ?? 0)])
    )

    return roleRows.map((row) => ({
      key: asString(row.role_key) as AuthRole["key"],
      name: asString(row.name),
      summary: asString(row.summary),
      actorType: asString(row.actor_type) as ActorType,
      isActive: asBoolean(row.is_active),
      permissions: permissionsByRole.get(asString(row.id)) ?? [],
      assignedUserCount: countsByRole.get(asString(row.id)) ?? 0,
    }) satisfies AuthRoleSummary)
  }

  async listPermissions() {
    const rows = await asQueryDatabase(this.database)
      .selectFrom(cxappTableNames.authPermissions)
      .selectAll()
      .orderBy("created_at")
      .execute()

    return rows.map((row) => ({
      key: asString(row.permission_key) as AuthPermission["key"],
      name: asString(row.name),
      summary: asString(row.summary),
      scopeType: asString(row.scope_type) as AuthPermission["scopeType"],
      appId: asNullableString(row.app_id),
      resourceKey: asString(row.resource_key),
      actionKey: asString(row.action_key),
      route: asNullableString(row.route),
      isActive: asBoolean(row.is_active),
    }) satisfies AuthPermission)
  }

  async getRole(roleId: string) {
    const queryDatabase = asQueryDatabase(this.database)
    const roleRow = await queryDatabase
      .selectFrom(cxappTableNames.authRoles)
      .selectAll()
      .where("id", "=", roleId)
      .executeTakeFirst()

    if (!roleRow) {
      return null
    }

    const [role] = (await this.listRoles()).filter((entry) => entry.key === roleId)
    return role ?? null
  }

  async getPermission(permissionId: string) {
    const permissions = await this.listPermissions()
    return permissions.find((permission) => permission.key === permissionId) ?? null
  }

  async listSessions() {
    const rows = await asQueryDatabase(this.database)
      .selectFrom(cxappTableNames.authSessions)
      .selectAll()
      .orderBy("created_at", "desc")
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
    roleKeys: string[]
    isSuperAdmin: boolean
    isActive?: boolean
  }) {
    const timestamp = new Date().toISOString()
    const queryDatabase = asQueryDatabase(this.database)

    await queryDatabase
      .insertInto(cxappTableNames.authUsers)
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
        is_active: input.isActive ?? true ? 1 : 0,
        failed_login_count: 0,
        last_failed_login_at: null,
        locked_until: null,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute()

    await queryDatabase
      .insertInto(cxappTableNames.authUserRoles)
      .values(
        input.roleKeys.map((roleKey) => ({
          id: `${input.id}:${roleKey}`,
          user_id: input.id,
          role_id: roleKey,
          is_active: 1,
          created_at: timestamp,
          updated_at: timestamp,
        }))
      )
      .execute()

    const stored = await this.findById(input.id)

    if (!stored) {
      throw new Error("Expected created auth user to be retrievable.")
    }

    return stored.user
  }

  async updateUser(input: {
    id: string
    email: string
    phoneNumber: string | null
    displayName: string
    actorType: ActorType
    avatarUrl: string | null
    organizationName: string | null
    isSuperAdmin: boolean
    isActive: boolean
  }) {
    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.authUsers)
      .set({
        email: input.email,
        phone_number: input.phoneNumber,
        display_name: input.displayName,
        actor_type: input.actorType,
        avatar_url: input.avatarUrl,
        organization_name: input.organizationName,
        is_super_admin: input.isSuperAdmin ? 1 : 0,
        is_active: input.isActive ? 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", input.id)
      .execute()
  }

  async replaceUserRoles(userId: string, roleKeys: string[]) {
    const queryDatabase = asQueryDatabase(this.database)
    const timestamp = new Date().toISOString()

    await queryDatabase
      .deleteFrom(cxappTableNames.authUserRoles)
      .where("user_id", "=", userId)
      .execute()

    await queryDatabase
      .insertInto(cxappTableNames.authUserRoles)
      .values(
        roleKeys.map((roleKey) => ({
          id: `${userId}:${roleKey}`,
          user_id: userId,
          role_id: roleKey,
          is_active: 1,
          created_at: timestamp,
          updated_at: timestamp,
        }))
      )
      .execute()
  }

  async createRole(input: {
    key: string
    name: string
    summary: string
    actorType: ActorType
    permissionKeys: string[]
    isActive: boolean
  }) {
    const timestamp = new Date().toISOString()
    const queryDatabase = asQueryDatabase(this.database)

    await queryDatabase
      .insertInto(cxappTableNames.authRoles)
      .values({
        id: input.key,
        role_key: input.key,
        name: input.name,
        summary: input.summary,
        actor_type: input.actorType,
        is_active: input.isActive ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute()

    await queryDatabase
      .insertInto(cxappTableNames.authRolePermissions)
      .values(
        input.permissionKeys.map((permissionKey) => ({
          id: `${input.key}:${permissionKey}`,
          role_id: input.key,
          permission_id: permissionKey,
          is_active: 1,
          created_at: timestamp,
          updated_at: timestamp,
        }))
      )
      .execute()

    return this.getRole(input.key)
  }

  async updateRole(input: {
    id: string
    name: string
    summary: string
    actorType: ActorType
    isActive: boolean
  }) {
    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.authRoles)
      .set({
        name: input.name,
        summary: input.summary,
        actor_type: input.actorType,
        is_active: input.isActive ? 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", input.id)
      .execute()
  }

  async createPermission(input: {
    key: string
    name: string
    summary: string
    scopeType: string
    appId: string | null
    resourceKey: string
    actionKey: string
    route: string | null
    isActive: boolean
  }) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .insertInto(cxappTableNames.authPermissions)
      .values({
        id: input.key,
        permission_key: input.key,
        name: input.name,
        summary: input.summary,
        scope_type: input.scopeType,
        app_id: input.appId,
        resource_key: input.resourceKey,
        action_key: input.actionKey,
        route: input.route,
        is_active: input.isActive ? 1 : 0,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .execute()

    return this.getPermission(input.key)
  }

  async updatePermission(input: {
    id: string
    name: string
    summary: string
    scopeType: string
    appId: string | null
    resourceKey: string
    actionKey: string
    route: string | null
    isActive: boolean
  }) {
    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.authPermissions)
      .set({
        name: input.name,
        summary: input.summary,
        scope_type: input.scopeType,
        app_id: input.appId,
        resource_key: input.resourceKey,
        action_key: input.actionKey,
        route: input.route,
        is_active: input.isActive ? 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", input.id)
      .execute()
  }

  async replaceRolePermissions(roleId: string, permissionKeys: string[]) {
    const queryDatabase = asQueryDatabase(this.database)
    const timestamp = new Date().toISOString()

    await queryDatabase
      .deleteFrom(cxappTableNames.authRolePermissions)
      .where("role_id", "=", roleId)
      .execute()

    await queryDatabase
      .insertInto(cxappTableNames.authRolePermissions)
      .values(
        permissionKeys.map((permissionKey) => ({
          id: `${roleId}:${permissionKey}`,
          role_id: roleId,
          permission_id: permissionKey,
          is_active: 1,
          created_at: timestamp,
          updated_at: timestamp,
        }))
      )
      .execute()
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
      .insertInto(cxappTableNames.authSessions)
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
      .selectFrom(cxappTableNames.authSessions)
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
      .updateTable(cxappTableNames.authSessions)
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
      .updateTable(cxappTableNames.authSessions)
      .set({
        last_seen_at: timestamp,
        updated_at: timestamp,
      })
      .where("id", "=", id)
      .execute()
  }

  async setSessionLastSeen(id: string, lastSeenAt: string | null) {
    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.authSessions)
      .set({
        last_seen_at: lastSeenAt,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .execute()
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.authUsers)
      .set({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", userId)
      .execute()
  }

  async setUserActiveState(userId: string, isActive: boolean) {
    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.authUsers)
      .set({
        is_active: isActive ? 1 : 0,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", userId)
      .execute()
  }

  async recordFailedLoginAttempt(userId: string, input: { failedLoginCount: number; lockedUntil: string | null }) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.authUsers)
      .set({
        failed_login_count: input.failedLoginCount,
        last_failed_login_at: timestamp,
        locked_until: input.lockedUntil,
        updated_at: timestamp,
      })
      .where("id", "=", userId)
      .execute()
  }

  async clearFailedLoginState(userId: string) {
    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.authUsers)
      .set({
        failed_login_count: 0,
        last_failed_login_at: null,
        locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", userId)
      .execute()
  }

  async revokeSessionsForUser(userId: string) {
    const timestamp = new Date().toISOString()

    await asQueryDatabase(this.database)
      .updateTable(cxappTableNames.authSessions)
      .set({
        revoked_at: timestamp,
        updated_at: timestamp,
      })
      .where("user_id", "=", userId)
      .where("revoked_at", "is", null)
      .execute()
  }

  async deleteUser(userId: string) {
    const queryDatabase = asQueryDatabase(this.database)

    await queryDatabase
      .deleteFrom(cxappTableNames.authSessions)
      .where("user_id", "=", userId)
      .execute()

    await queryDatabase
      .deleteFrom(cxappTableNames.authUserRoles)
      .where("user_id", "=", userId)
      .execute()

    await queryDatabase
      .deleteFrom(cxappTableNames.authUsers)
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
      .updateTable(cxappTableNames.authContactVerifications)
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
      .insertInto(cxappTableNames.authContactVerifications)
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
      .selectFrom(cxappTableNames.authContactVerifications)
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
      .updateTable(cxappTableNames.authContactVerifications)
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
      .updateTable(cxappTableNames.authContactVerifications)
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
      .updateTable(cxappTableNames.authContactVerifications)
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
      .selectFrom(`${cxappTableNames.authUserRoles} as ur`)
      .innerJoin(`${cxappTableNames.authRoles} as r`, "ur.role_id", "r.id")
      .select([
        "ur.user_id as user_id",
        "r.id as role_id",
        "r.role_key as role_key",
        "r.name as name",
        "r.summary as summary",
        "r.actor_type as actor_type",
        "r.is_active as is_active",
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
            .selectFrom(`${cxappTableNames.authRolePermissions} as rp`)
            .innerJoin(
              `${cxappTableNames.authPermissions} as p`,
              "rp.permission_id",
              "p.id"
            )
            .select([
              "rp.role_id as role_id",
              "p.permission_key as permission_key",
              "p.name as name",
              "p.summary as summary",
              "p.scope_type as scope_type",
              "p.app_id as app_id",
              "p.resource_key as resource_key",
              "p.action_key as action_key",
              "p.route as route",
              "p.is_active as is_active",
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
        scopeType: asString(row.scope_type) as AuthPermission["scopeType"],
        appId: asNullableString(row.app_id),
        resourceKey: asString(row.resource_key),
        actionKey: asString(row.action_key),
        route: asNullableString(row.route),
        isActive: asBoolean(row.is_active),
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
        isActive: asBoolean(row.is_active),
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
        failedLoginCount: Number(row.failed_login_count ?? 0),
        lastFailedLoginAt: asNullableString(row.last_failed_login_at),
        lockedUntil: asNullableString(row.locked_until),
      } satisfies StoredAuthUser
    })
  }
}

export type { ContactVerificationRecord, StoredAuthUser }
