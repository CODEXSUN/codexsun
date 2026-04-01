import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import type { ActorType, PermissionKey, RoleKey } from '@shared/index'
import type { RowDataPacket } from 'mysql2/promise'
import { environment } from '../../../../config/environment'
import { authTableNames } from '../../../table-names'
import type { Migration } from '../../migration'

const defaultPermissions: {
  key: PermissionKey
  name: string
  summary: string
}[] = [
  { key: 'dashboard:view', name: 'Dashboard View', summary: 'View dashboard surfaces.' },
  { key: 'users:manage', name: 'User Management', summary: 'Manage platform users.' },
  { key: 'roles:manage', name: 'Role Management', summary: 'Manage roles and assignments.' },
  { key: 'permissions:manage', name: 'Permission Management', summary: 'Manage permission mappings.' },
  { key: 'vendors:view', name: 'Vendor Access', summary: 'View vendor-facing records.' },
  { key: 'customers:view', name: 'Customer Access', summary: 'View customer-facing records.' },
]

const defaultRoles: {
  key: RoleKey
  actorType: ActorType
  name: string
  summary: string
  permissions: PermissionKey[]
}[] = [
  {
    key: 'admin_owner',
    actorType: 'admin',
    name: 'Admin Owner',
    summary: 'Full platform administration for bootstrap.',
    permissions: ['dashboard:view', 'users:manage', 'roles:manage', 'permissions:manage', 'vendors:view', 'customers:view'],
  },
  {
    key: 'staff_operator',
    actorType: 'staff',
    name: 'Staff Operator',
    summary: 'Operational staff access to the shared workspace.',
    permissions: ['dashboard:view', 'vendors:view', 'customers:view'],
  },
  {
    key: 'customer_portal',
    actorType: 'customer',
    name: 'Customer Portal',
    summary: 'Customer-facing authenticated access.',
    permissions: ['dashboard:view', 'customers:view'],
  },
  {
    key: 'vendor_portal',
    actorType: 'vendor',
    name: 'Vendor Portal',
    summary: 'Vendor-facing authenticated access.',
    permissions: ['dashboard:view', 'vendors:view'],
  },
]

interface ExistingUserRow extends RowDataPacket {
  id: string
}

export const authFoundationMigration: Migration = {
  id: '001-auth-foundation',
  name: 'Auth foundation tables and seed data',
  async up({ db }) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${authTableNames.users} (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(320) NOT NULL UNIQUE,
        display_name VARCHAR(120) NOT NULL,
        avatar_url VARCHAR(500) NULL,
        actor_type VARCHAR(32) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        organization_name VARCHAR(120) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${authTableNames.roles} (
        id VARCHAR(64) PRIMARY KEY,
        role_key VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        summary VARCHAR(255) NOT NULL,
        actor_type VARCHAR(32) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${authTableNames.permissions} (
        id VARCHAR(64) PRIMARY KEY,
        permission_key VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        summary VARCHAR(255) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${authTableNames.userRoles} (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        role_id VARCHAR(64) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_auth_user_roles_user_role (user_id, role_id),
        CONSTRAINT fk_auth_user_roles_user FOREIGN KEY (user_id) REFERENCES ${authTableNames.users} (id),
        CONSTRAINT fk_auth_user_roles_role FOREIGN KEY (role_id) REFERENCES ${authTableNames.roles} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${authTableNames.rolePermissions} (
        id VARCHAR(64) PRIMARY KEY,
        role_id VARCHAR(64) NOT NULL,
        permission_id VARCHAR(64) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_auth_role_permissions_role_permission (role_id, permission_id),
        CONSTRAINT fk_auth_role_permissions_role FOREIGN KEY (role_id) REFERENCES ${authTableNames.roles} (id),
        CONSTRAINT fk_auth_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES ${authTableNames.permissions} (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    for (const permission of defaultPermissions) {
      await db.execute(
        `
          INSERT INTO ${authTableNames.permissions} (id, permission_key, name, summary)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            summary = VALUES(summary),
            is_active = 1
        `,
        [permission.key, permission.key, permission.name, permission.summary],
      )
    }

    for (const role of defaultRoles) {
      await db.execute(
        `
          INSERT INTO ${authTableNames.roles} (id, role_key, name, summary, actor_type)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            summary = VALUES(summary),
            actor_type = VALUES(actor_type),
            is_active = 1
        `,
        [role.key, role.key, role.name, role.summary, role.actorType],
      )

      for (const permissionKey of role.permissions) {
        await db.execute(
          `
            INSERT INTO ${authTableNames.rolePermissions} (id, role_id, permission_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
              is_active = 1
          `,
          [`${role.key}:${permissionKey}`, role.key, permissionKey],
        )
      }
    }

    if (!environment.seed.enabled) {
      return
    }

    const existingUser = await db.first<ExistingUserRow>(
      `SELECT id FROM ${authTableNames.users} WHERE email = ? LIMIT 1`,
      [environment.seed.defaultUser.email],
    )

    if (existingUser) {
      return
    }

    const userId = randomUUID()
    const passwordHash = await bcrypt.hash(environment.seed.defaultUser.password, 10)

    await db.execute(
      `
        INSERT INTO ${authTableNames.users} (
          id,
          email,
          display_name,
          avatar_url,
          actor_type,
          password_hash,
          organization_name
        )
        VALUES (?, ?, ?, ?, 'admin', ?, ?)
      `,
      [
        userId,
        environment.seed.defaultUser.email,
        environment.seed.defaultUser.displayName,
        environment.seed.defaultUser.avatarUrl,
        passwordHash,
        'CODEXSUN',
      ],
    )

    await db.execute(
      `
        INSERT INTO ${authTableNames.userRoles} (id, user_id, role_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          is_active = 1
      `,
      [`${userId}:admin_owner`, userId, 'admin_owner'],
    )
  },
}


