import type { PlatformModuleSeed } from '@codexsun/platform-core-api'
import type { Environment } from '../../../config.js'
import type { Database } from '../../../database.js'
import type { IdentityPasswordHasher } from '../domain/identity.ports.js'

const superAdminUserId = '00000000-0000-4000-8000-000000000001'
const superAdminRoleId = '00000000-0000-4000-8000-000000000002'
const wildcardPermissionId = '00000000-0000-4000-8000-000000000003'

export function createIdentitySeeds(
  environment: Environment,
  passwords: IdentityPasswordHasher,
): readonly PlatformModuleSeed<Database>[] {
  return [
    {
      checksum: 'sha256:7b58483577187ee1874efa78679394f9179c99c1856dd6a7189121d25ed62c86',
      id: '0001-default-super-admin',
      version: '1.0.0',
      async run(database) {
        const now = new Date()
        await database
          .insertInto('identity_users')
          .values({
            created_at: now,
            display_name: environment.IDENTITY_SUPER_ADMIN_NAME,
            email: environment.IDENTITY_SUPER_ADMIN_EMAIL.toLowerCase(),
            id: superAdminUserId,
            portal: 'super-admin',
            status: 'active',
            updated_at: now,
          })
          .onDuplicateKeyUpdate({ updated_at: now })
          .execute()
        await database
          .insertInto('identity_credentials')
          .values({
            password_hash: await passwords.hash(environment.IDENTITY_SUPER_ADMIN_PASSWORD),
            updated_at: now,
            user_id: superAdminUserId,
          })
          .onDuplicateKeyUpdate({ updated_at: now })
          .execute()
        await database
          .insertInto('identity_roles')
          .values({ id: superAdminRoleId, name: 'Super administrator', portal: 'super-admin' })
          .onDuplicateKeyUpdate({ name: 'Super administrator' })
          .execute()
        await database
          .insertInto('identity_permissions')
          .values({ id: wildcardPermissionId, name: '*' })
          .onDuplicateKeyUpdate({ name: '*' })
          .execute()
        await database
          .insertInto('identity_user_roles')
          .values({ role_id: superAdminRoleId, user_id: superAdminUserId })
          .onDuplicateKeyUpdate({ role_id: superAdminRoleId })
          .execute()
        await database
          .insertInto('identity_role_permissions')
          .values({ permission_id: wildcardPermissionId, role_id: superAdminRoleId })
          .onDuplicateKeyUpdate({ permission_id: wildcardPermissionId })
          .execute()
      },
    },
    {
      checksum: 'sha256:dace052708d5291edbd07dfa3c654a1d20e20b059ac3e087d26ca2c4d723ba3e',
      id: '0002-default-super-admin-identifier',
      version: '1.1.0',
      async run(database) {
        const now = new Date()
        await database
          .insertInto('identity_user_identifiers')
          .values({
            created_at: now,
            id: '00000000-0000-4000-8000-000000000004',
            identifier_type: 'email',
            identifier_value: environment.IDENTITY_SUPER_ADMIN_EMAIL.toLowerCase(),
            user_id: superAdminUserId,
            verified_at: now,
          })
          .onDuplicateKeyUpdate({ user_id: superAdminUserId })
          .execute()
      },
    },
  ]
}
