import type { ColumnType } from 'kysely'

type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface IdentityUserTable {
  created_at: Timestamp
  display_name: string
  email: string
  id: string
  portal: string
  status: string
  updated_at: Timestamp
}

export interface IdentityCredentialTable {
  password_hash: string
  updated_at: Timestamp
  user_id: string
}

export interface IdentitySessionTable {
  created_at: Timestamp
  expires_at: Timestamp
  id: string
  portal: string
  revoked_at: Timestamp | null
  token_hash: string
  user_id: string
}

export interface IdentityRoleTable {
  id: string
  name: string
  portal: string
}

export interface IdentityPermissionTable {
  id: string
  name: string
}

export interface IdentityRolePermissionTable {
  permission_id: string
  role_id: string
}

export interface IdentityUserRoleTable {
  role_id: string
  user_id: string
}

export interface IdentityDatabaseSchema {
  identity_credentials: IdentityCredentialTable
  identity_permissions: IdentityPermissionTable
  identity_role_permissions: IdentityRolePermissionTable
  identity_roles: IdentityRoleTable
  identity_sessions: IdentitySessionTable
  identity_user_roles: IdentityUserRoleTable
  identity_users: IdentityUserTable
}
