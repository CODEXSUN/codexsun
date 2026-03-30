import { defineDatabaseSeeder } from "../../../framework/src/runtime/database/process/types.js"
import { hashPassword } from "../../../framework/src/runtime/security/password.js"

import { authPermissions, authRoles, authUsers } from "../../src/data/auth-seed.js"
import { asQueryDatabase } from "../../src/data/query-database.js"

import { coreTableNames } from "../table-names.js"

export const coreAuthFoundationSeeder = defineDatabaseSeeder({
  id: "core:auth:05-auth-foundation",
  appId: "core",
  moduleKey: "auth",
  name: "Seed auth permissions, roles, and users",
  order: 50,
  run: async ({ database }) => {
    const queryDatabase = asQueryDatabase(database)

    await queryDatabase.deleteFrom(coreTableNames.authRolePermissions).execute()
    await queryDatabase.deleteFrom(coreTableNames.authUserRoles).execute()
    await queryDatabase.deleteFrom(coreTableNames.authSessions).execute()
    await queryDatabase.deleteFrom(coreTableNames.authContactVerifications).execute()
    await queryDatabase.deleteFrom(coreTableNames.authUsers).execute()
    await queryDatabase.deleteFrom(coreTableNames.authRoles).execute()
    await queryDatabase.deleteFrom(coreTableNames.authPermissions).execute()

    await queryDatabase
      .insertInto(coreTableNames.authPermissions)
      .values(
        authPermissions.map((permission) => ({
          id: permission.key,
          permission_key: permission.key,
          name: permission.name,
          summary: permission.summary,
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      )
      .execute()

    await queryDatabase
      .insertInto(coreTableNames.authRoles)
      .values(
        authRoles.map((role) => ({
          id: role.key,
          role_key: role.key,
          name: role.name,
          summary: role.summary,
          actor_type: role.actorType,
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      )
      .execute()

    await queryDatabase
      .insertInto(coreTableNames.authRolePermissions)
      .values(
        authRoles.flatMap((role) =>
          role.permissions.map((permission) => ({
            id: `${role.key}:${permission.key}`,
            role_id: role.key,
            permission_id: permission.key,
            is_active: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        )
      )
      .execute()

    const userValues = await Promise.all(
      authUsers.map(async (user) => ({
        id: user.id,
        email: user.email,
        phone_number: user.phoneNumber,
        display_name: user.displayName,
        actor_type: user.actorType,
        password_hash: await hashPassword(user.password),
        avatar_url: user.avatarUrl,
        organization_name: user.organizationName,
        is_super_admin: user.isSuperAdmin ? 1 : 0,
        is_active: user.isActive ? 1 : 0,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      }))
    )

    await queryDatabase
      .insertInto(coreTableNames.authUsers)
      .values(userValues)
      .execute()

    await queryDatabase
      .insertInto(coreTableNames.authUserRoles)
      .values(
        authUsers.map((user) => ({
          id: `${user.id}:${user.roleKey}`,
          user_id: user.id,
          role_id: user.roleKey,
          is_active: 1,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
        }))
      )
      .execute()
  },
})
